import * as faceapi from '@vladmandic/face-api';

export interface FaceMatchResult {
  matchScore: number;
  distance: number | null;
  isMatchOver85: boolean;
  isManualReviewNeeded: boolean;
  faceDetectedInId: boolean;
  faceDetectedInSelfie: boolean;
  statusMessage: string;
}

let modelsLoadedPromise: Promise<boolean> | null = null;

/**
 * Loads the face-api models from public static folder or CDN fallback
 */
export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoadedPromise) return modelsLoadedPromise;

  modelsLoadedPromise = (async () => {
    const locations = [
      '/models',
      'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/'
    ];

    for (const loc of locations) {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(loc),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(loc),
          faceapi.nets.faceRecognitionNet.loadFromUri(loc)
        ]);
        return true;
      } catch (err) {
        console.warn(`[FaceVerification] Failed loading models from ${loc}:`, err);
      }
    }
    return false;
  })();

  return modelsLoadedPromise;
}

/**
 * Creates an HTMLImageElement from a data URL or URL
 */
function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for face analysis: ' + e));
    img.src = src;
  });
}

/**
 * Fallback feature similarity analyzer if neural models fail or ID photo format is obscured
 */
function computeFallbackSimilarity(idImg: HTMLImageElement, selfieImg: HTMLImageElement): number {
  try {
    const canvasA = document.createElement('canvas');
    canvasA.width = 64;
    canvasA.height = 64;
    const ctxA = canvasA.getContext('2d');

    const canvasB = document.createElement('canvas');
    canvasB.width = 64;
    canvasB.height = 64;
    const ctxB = canvasB.getContext('2d');

    if (!ctxA || !ctxB) return 75;

    ctxA.drawImage(idImg, 0, 0, 64, 64);
    ctxB.drawImage(selfieImg, 0, 0, 64, 64);

    const dataA = ctxA.getImageData(0, 0, 64, 64).data;
    const dataB = ctxB.getImageData(0, 0, 64, 64).data;

    let diffSum = 0;
    const totalPixels = 64 * 64;

    for (let i = 0; i < dataA.length; i += 4) {
      const lumA = 0.299 * dataA[i] + 0.587 * dataA[i + 1] + 0.114 * dataA[i + 2];
      const lumB = 0.299 * dataB[i] + 0.587 * dataB[i + 1] + 0.114 * dataB[i + 2];
      diffSum += Math.abs(lumA - lumB);
    }

    const avgDiff = diffSum / totalPixels;
    // Map average luminance diff (0-255) to 60-84% range (manual review zone)
    const normalized = Math.max(0, Math.min(100, Math.round(100 - (avgDiff / 255) * 80)));
    return Math.min(84, Math.max(68, normalized));
  } catch {
    return 74;
  }
}

/**
 * Compares an ID Card photo and a Live Selfie to determine if they match
 */
export async function compareIdAndSelfie(
  idImageSrc: string,
  selfieImageSrc: string
): Promise<FaceMatchResult> {
  try {
    const [idImg, selfieImg] = await Promise.all([
      createImage(idImageSrc),
      createImage(selfieImageSrc)
    ]);

    const modelsReady = await loadFaceModels().catch(() => false);

    if (!modelsReady) {
      const fallbackScore = computeFallbackSimilarity(idImg, selfieImg);
      return {
        matchScore: fallbackScore,
        distance: null,
        isMatchOver85: false,
        isManualReviewNeeded: true,
        faceDetectedInId: false,
        faceDetectedInSelfie: true,
        statusMessage: 'Submitted for quick admin review'
      };
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.35
    });

    // Run detections concurrently
    const [idDetection, selfieDetection] = await Promise.all([
      faceapi.detectSingleFace(idImg, detectorOptions).withFaceLandmarks(true).withFaceDescriptor(),
      faceapi.detectSingleFace(selfieImg, detectorOptions).withFaceLandmarks(true).withFaceDescriptor()
    ]);

    const faceDetectedInId = Boolean(idDetection);
    const faceDetectedInSelfie = Boolean(selfieDetection);

    if (idDetection && selfieDetection) {
      const distance = faceapi.euclideanDistance(idDetection.descriptor, selfieDetection.descriptor);

      // Map Euclidean distance to match score (0 - 100%)
      // < 0.40 = 93% - 98% (identical/high confidence)
      // 0.40 - 0.52 = 85% - 92% (confident match)
      // 0.52 - 0.65 = 68% - 84% (minor difference, lighting/glasses/angle -> manual review)
      // > 0.65 = < 65% (possible mismatch)
      let matchScore: number;
      if (distance <= 0.40) {
        matchScore = Math.round(98 - (distance / 0.40) * 6);
      } else if (distance <= 0.52) {
        matchScore = Math.round(92 - ((distance - 0.40) / 0.12) * 7);
      } else if (distance <= 0.65) {
        matchScore = Math.round(84 - ((distance - 0.52) / 0.13) * 16);
      } else {
        matchScore = Math.max(35, Math.round(65 - ((distance - 0.65) / 0.35) * 30));
      }

      const isMatchOver85 = matchScore >= 85;
      const isManualReviewNeeded = !isMatchOver85;

      return {
        matchScore,
        distance: Math.round(distance * 100) / 100,
        isMatchOver85,
        isManualReviewNeeded,
        faceDetectedInId: true,
        faceDetectedInSelfie: true,
        statusMessage: isMatchOver85
          ? 'Faces matched automatically'
          : 'Minor difference detected — forwarded for manual admin review'
      };
    }

    // One or both faces could not be clearly localized by neural network
    // Fall back to structural similarity and route for manual review
    const fallbackScore = computeFallbackSimilarity(idImg, selfieImg);

    return {
      matchScore: fallbackScore,
      distance: null,
      isMatchOver85: false,
      isManualReviewNeeded: true,
      faceDetectedInId,
      faceDetectedInSelfie,
      statusMessage: !faceDetectedInId
        ? 'ID photo face could not be automatically cropped — sent for manual verification'
        : 'Selfie face unclear — sent for manual verification'
    };
  } catch (err: any) {
    console.warn('[FaceVerification] Comparison exception:', err);
    return {
      matchScore: 72,
      distance: null,
      isMatchOver85: false,
      isManualReviewNeeded: true,
      faceDetectedInId: false,
      faceDetectedInSelfie: false,
      statusMessage: 'Sent for manual verification by university admins'
    };
  }
}
