const sharp = require('sharp');
const { RekognitionClient, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const { TextractClient, DetectDocumentTextCommand } = require('@aws-sdk/client-textract');

let rekognition;
let textract;
function getClients() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) return null;
  if (!rekognition) rekognition = new RekognitionClient({ region });
  if (!textract) textract = new TextractClient({ region });
  return { rekognition, textract };
}
function decodeImage(value) {
  if (typeof value !== 'string') throw new Error('Image data is missing.');
  const match = value.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) throw new Error('AWS checks require a JPEG, PNG, or WebP image data URL.');
  return Buffer.from(match[2], 'base64');
}
async function toAwsImage(value) {
  const bytes = await sharp(decodeImage(value), { limitInputPixels: 40000000 })
    .rotate().jpeg({ quality: 90 }).toBuffer();
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Processed image exceeds AWS Rekognition 5MB limit.');
  return bytes;
}
function normalizeText(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function nameAppearsInOcr(name, text) {
  const tokens = [...new Set((String(name || '').toUpperCase().match(/[A-Z]{2,}/g) || [])
    .filter((token) => !['THE', 'AND'].includes(token)))];
  return tokens.length >= 2 && tokens.every((token) => String(text || '').toUpperCase().includes(token));
}
async function verifyStudentDocuments({ idPhotoUrl, selfiePhotoUrl, studentId, studentName }) {
  const clients = getClients();
  if (!clients) return {
    configured: false, passed: false, autoApprovalEligible: false,
    reason: 'AWS_REGION is not configured; manual review is required.'
  };
  if (!idPhotoUrl || !selfiePhotoUrl) return {
    configured: true, passed: false, autoApprovalEligible: false,
    reason: 'A student ID and a separate selfie are both required.'
  };
  try {
    const [idBytes, selfieBytes] = await Promise.all([toAwsImage(idPhotoUrl), toAwsImage(selfiePhotoUrl)]);
    const [faceResult, ocrResult] = await Promise.all([
      clients.rekognition.send(new CompareFacesCommand({
        SourceImage: { Bytes: idBytes }, TargetImage: { Bytes: selfieBytes },
        SimilarityThreshold: 90, QualityFilter: 'HIGH'
      })),
      clients.textract.send(new DetectDocumentTextCommand({ Document: { Bytes: idBytes } }))
    ]);
    const faceMatch = (faceResult.FaceMatches || []).sort((a, b) =>
      Number(b.Similarity || 0) - Number(a.Similarity || 0))[0];
    const faceSimilarity = Number(faceMatch?.Similarity || 0);
    const lines = (ocrResult.Blocks || []).filter((b) => b.BlockType === 'LINE' && b.Text);
    const ocrText = lines.map((b) => b.Text).join('\n');
    const studentIdFound = normalizeText(ocrText).includes(normalizeText(studentId));
    const studentNameFound = nameAppearsInOcr(studentName, ocrText);
    const faceMatched = Boolean(faceMatch && faceSimilarity >= 90);
    return {
      configured: true, passed: faceMatched && studentIdFound && studentNameFound,
      autoApprovalEligible: false, faceSimilarity: Math.round(faceSimilarity * 100) / 100,
      faceMatched, studentIdFound, studentNameFound, ocrLineCount: lines.length,
      reason: !faceMatched ? 'AWS could not establish a sufficiently strong face match.' :
        !studentIdFound ? 'Student ID number was not found in the ID document OCR.' :
          !studentNameFound ? 'Account name could not be confirmed from ID document OCR.' :
            'AWS checks passed; trusted server-side liveness is still required before auto-approval.'
    };
  } catch (error) {
    return {
      configured: true, passed: false, autoApprovalEligible: false,
      reason: 'AWS document verification could not be completed. Manual review is required.',
      errorCode: error.name || error.code || 'AWS_VERIFICATION_ERROR'
    };
  }
}
module.exports = { verifyStudentDocuments, normalizeText };
