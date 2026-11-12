const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

function decodeImage(value) {
  if (typeof value !== 'string') throw new Error('Image data is missing.');
  const match = value.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error('A JPEG, PNG, or WebP image data URL is required for OCR.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('Image must be non-empty and no larger than 10MB.');
  return bytes;
}
function normalizeText(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function nameAppearsInOcr(name, text) {
  const tokens = [...new Set((String(name || '').toUpperCase().match(/[A-Z]{2,}/g) || []).filter((token) => !['THE', 'AND'].includes(token)))];
  return tokens.length >= 2 && tokens.every((token) => String(text || '').toUpperCase().includes(token));
}
async function extractDocumentText(imageDataUrl) {
  const normalized = await sharp(decodeImage(imageDataUrl), { limitInputPixels: 40000000 })
    .rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).grayscale().png().toBuffer();
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(normalized);
    return String(data?.text || '');
  } finally {
    await worker.terminate();
  }
}
async function verifyStudentDocuments({ idPhotoUrl, studentId, studentName }) {
  if (!idPhotoUrl) return { configured: true, passed: false, autoApprovalEligible: false, reason: 'A student ID image is required for OCR; manual review is required.' };
  try {
    const ocrText = await extractDocumentText(idPhotoUrl);
    const studentIdFound = normalizeText(ocrText).includes(normalizeText(studentId));
    const studentNameFound = nameAppearsInOcr(studentName, ocrText);
    return {
      configured: true, passed: studentIdFound && studentNameFound, autoApprovalEligible: false,
      studentIdFound, studentNameFound,
      ocrLineCount: ocrText.split(/\r?\n/).filter(Boolean).length,
      reason: !studentIdFound ? 'OCR could not confirm the submitted student ID; manual review is required.' :
        !studentNameFound ? 'OCR could not confirm the account name; manual review is required.' :
          'Local OCR extracted matching text. An authorized campus administrator must still verify the original document and selfie.'
    };
  } catch (error) {
    return { configured: true, passed: false, autoApprovalEligible: false, reason: 'Local OCR could not process the document. Manual review is required.', errorCode: error.name || 'OCR_PROCESSING_ERROR' };
  }
}
module.exports = { verifyStudentDocuments, normalizeText, extractDocumentText };
