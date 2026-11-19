const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const logger = require('../utils/logger');

function decodeImage(value) {
  if (typeof value !== 'string') throw new Error('Image data is missing.');
  const match = value.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error('A JPEG, PNG, or WebP image data URL is required for OCR.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
    throw new Error('Image must be non-empty and no larger than 10MB.');
  }
  return bytes;
}

function normalizeText(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalizes common OCR misread characters between letters and digits.
 * Very common on laminated university cards (e.g. O->0, I/l->1, S->5, B->8).
 */
function normalizeOcrDigits(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[OD]/g, '0')
    .replace(/[IL|]/g, '1')
    .replace(/[Z]/g, '2')
    .replace(/[S]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/[^0-9]/g, '');
}

/**
 * Checks if user name tokens appear in the OCR recognized text.
 */
function nameAppearsInOcr(name, text) {
  if (!name || !text) return false;
  const upperText = String(text).toUpperCase();
  const ignore = new Set(['THE', 'AND', 'FOR', 'NOT', 'STUDENT', 'UNIVERSITY', 'COLLEGE', 'CEBU']);
  const tokens = [...new Set((String(name).toUpperCase().match(/[A-Z]{2,}/g) || []).filter((t) => !ignore.has(t)))];
  if (tokens.length === 0) return true;
  
  const matchCount = tokens.filter((token) => upperText.includes(token)).length;
  return matchCount >= Math.min(tokens.length, Math.max(1, Math.ceil(tokens.length * 0.4)));
}

/**
 * Checks for institutional markers (University of Cebu, campus names, departments)
 */
function detectInstitutionalMarkers(ocrText) {
  const upperText = String(ocrText || '').toUpperCase();
  const markers = [
    'UNIVERSITY OF CEBU',
    'UNIVERSITY',
    'CEBU',
    'STUDENT',
    'COLLEGE',
    'CAMPUS',
    'MAIN CAMPUS',
    'BANILAD',
    'METC',
    'LAPU-LAPU',
    'LAPULAPU',
    'MANDAUE',
    'LM CAMPUS',
    'PT CAMPUS',
    'PRIZTO',
    'COMMUNITY',
    'DEPARTMENT',
    'ACADEMIC',
    'ENROLLMENT',
    'ASSESSMENT',
    'STUDYLOAD',
    'REPUBLIC OF THE PHILIPPINES',
    'U.C.',
    'UC'
  ];
  const matched = markers.filter((m) => {
    if (m === 'UC' || m === 'U.C.') {
      return /\bU\.?C\.?\b/i.test(upperText);
    }
    return upperText.includes(m);
  });
  return {
    isUcDocument: matched.length > 0,
    matchedMarkers: matched
  };
}

/**
 * Extracts possible student ID numbers from OCR text
 */
function extractCandidateStudentIds(ocrText) {
  const text = String(ocrText || '');
  const candidateSet = new Set();
  
  // 1. Hyphenated pattern with optional whitespace or special dashes (e.g. 2024-12345, 2024 - 12345, 2024–12345)
  const hyphenPattern = /\b(\d{2,4})\s*[-–—]\s*(\d{4,8})\b/g;
  let match;
  while ((match = hyphenPattern.exec(text)) !== null) {
    candidateSet.add(`${match[1]}-${match[2]}`);
    candidateSet.add(`${match[1]}${match[2]}`);
  }

  // 2. Pure digit pattern
  const digitPattern = /\b\d{6,12}\b/g;
  const digitMatches = text.match(digitPattern) || [];
  digitMatches.forEach((d) => candidateSet.add(d));

  // 3. ID / Student No. prefix matching with OCR digit normalization
  const prefixPattern = /(?:ID|STUDENT\s*NO\.?|ID\s*NO\.?|SN|NO\.?)\s*[:#-]?\s*([0-9A-Za-z-]{5,15})/gi;
  while ((match = prefixPattern.exec(text)) !== null) {
    const rawClean = match[1].replace(/\s+/g, '');
    if (rawClean.length >= 5) {
      candidateSet.add(rawClean);
      const digitsOnly = normalizeOcrDigits(rawClean);
      if (digitsOnly.length >= 6) {
        candidateSet.add(digitsOnly);
      }
    }
  }

  return [...candidateSet];
}

/**
 * Preprocesses image with Sharp and extracts text via Tesseract.js
 */
async function extractDocumentText(imageDataUrl) {
  const inputBuffer = decodeImage(imageDataUrl);
  const normalized = await sharp(inputBuffer, { limitInputPixels: 40000000 })
    .rotate()
    .resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true })
    .grayscale()
    .normalise()
    .sharpen({ sigma: 1.5 })
    .png()
    .toBuffer();

  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(normalized);
    return {
      text: String(data?.text || ''),
      confidence: typeof data?.confidence === 'number' ? data.confidence : 80,
      lines: (data?.lines || []).map((l) => l.text.trim()).filter(Boolean)
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Main verification routine for student ID documents
 */
async function verifyStudentDocuments({ idPhotoUrl, studentId, studentName }) {
  if (!idPhotoUrl) {
    return {
      configured: true,
      passed: false,
      autoApprovalEligible: false,
      ocrConfidence: 0,
      isUcDocument: false,
      studentIdFound: false,
      studentNameFound: false,
      detectedStudentId: null,
      reason: 'A student ID image is required for automated OCR verification.'
    };
  }

  try {
    const { text: ocrText, confidence: tesseractRawConfidence, lines } = await extractDocumentText(idPhotoUrl);
    const cleanOcrNorm = normalizeText(ocrText);
    const cleanSubmittedId = normalizeText(studentId);
    const cleanOcrDigits = normalizeOcrDigits(ocrText);
    const submittedDigits = normalizeOcrDigits(studentId);

    // 1. Candidate Student IDs
    const candidateIds = extractCandidateStudentIds(ocrText);
    const studentIdFound = Boolean(
      (cleanSubmittedId && cleanOcrNorm.includes(cleanSubmittedId)) ||
      (submittedDigits && submittedDigits.length >= 6 && cleanOcrDigits.includes(submittedDigits)) ||
      candidateIds.some((c) => normalizeText(c) === cleanSubmittedId || (submittedDigits && submittedDigits.length >= 6 && normalizeOcrDigits(c) === submittedDigits))
    );
    const detectedStudentId = candidateIds.length > 0 ? candidateIds[0] : null;

    // 2. Institutional Markers
    const { isUcDocument, matchedMarkers } = detectInstitutionalMarkers(ocrText);

    // 3. Name check
    const studentNameFound = nameAppearsInOcr(studentName, ocrText);

    // 4. Calculate composite OCR Confidence Score (0 - 100)
    let score = 0;
    if (lines.length > 0) score += 10;
    if (isUcDocument) score += 35;
    if (studentIdFound) score += 35;
    else if (detectedStudentId) score += 15;
    if (studentNameFound) score += 20;

    const ocrConfidence = Math.min(100, Math.max(0, score));

    let reason = '';
    if (!isUcDocument && !studentIdFound) {
      reason = 'OCR detected low document clarity. Ensure your University of Cebu ID is well-lit and unobstructed.';
    } else if (!studentIdFound) {
      reason = detectedStudentId
        ? `OCR detected ID [${detectedStudentId}], differing from entered [${studentId || 'None'}].`
        : 'OCR could not clearly extract the student ID number from the image.';
    } else if (!studentNameFound && studentName) {
      reason = 'Student ID number matched. Student name could not be fully confirmed by OCR.';
    } else {
      reason = 'Automated OCR scan confirmed University credentials, matching student ID, and name.';
    }

    return {
      configured: true,
      passed: studentIdFound && (isUcDocument || studentNameFound),
      autoApprovalEligible: false,
      ocrConfidence,
      isUcDocument,
      matchedMarkers,
      studentIdFound,
      studentNameFound,
      detectedStudentId: detectedStudentId || (studentIdFound ? studentId : null),
      ocrLineCount: lines.length,
      rawOcrConfidence: tesseractRawConfidence,
      reason,
      summary: `${isUcDocument ? 'UC Document' : 'Document'} | ${studentIdFound ? 'ID Matched' : 'ID Pending'} | ${studentNameFound ? 'Name Matched' : 'Name Pending'}`
    };
  } catch (error) {
    logger.warn('[studentDocumentOcr] OCR processing error:', error.message);
    return {
      configured: true,
      passed: false,
      autoApprovalEligible: false,
      ocrConfidence: 0,
      isUcDocument: false,
      studentIdFound: false,
      studentNameFound: false,
      detectedStudentId: null,
      ocrLineCount: 0,
      reason: 'Automated OCR scanner could not process the image. Your submission will be evaluated by campus administrators.',
      errorCode: error.name || 'OCR_PROCESSING_ERROR'
    };
  }
}

module.exports = {
  verifyStudentDocuments,
  normalizeText,
  extractDocumentText,
  detectInstitutionalMarkers,
  extractCandidateStudentIds
};
