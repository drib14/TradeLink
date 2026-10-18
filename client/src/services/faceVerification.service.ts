// Deprecated: Homemade live facial verification replaced by secure institutional document upload and Sharp KYC verification
export interface FaceMatchResult {
  matchScore: number;
  distance: number | null;
  isMatchOver85: boolean;
  isManualReviewNeeded: boolean;
  faceDetectedInId: boolean;
  faceDetectedInSelfie: boolean;
  statusMessage: string;
}

export async function loadFaceModels(): Promise<boolean> {
  return true;
}

export async function compareIdAndSelfie(): Promise<FaceMatchResult> {
  return {
    matchScore: 100,
    distance: null,
    isMatchOver85: true,
    isManualReviewNeeded: true,
    faceDetectedInId: true,
    faceDetectedInSelfie: true,
    statusMessage: 'Verified via document submission'
  };
}
