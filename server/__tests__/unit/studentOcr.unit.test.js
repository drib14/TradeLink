const sharp = require('sharp');
const { verifyStudentDocuments, normalizeText, detectInstitutionalMarkers, extractCandidateStudentIds } = require('../../src/services/studentDocumentOcr.service');

jest.setTimeout(40000);

describe('Unit Test: Student Document OCR & Verification Service', () => {
  it('should normalize text and remove non-alphanumeric characters', () => {
    expect(normalizeText('2024-12345')).toBe('202412345');
    expect(normalizeText('University of Cebu (Main)')).toBe('UNIVERSITYOFCEBUMAIN');
  });

  it('should detect University of Cebu institutional markers in text', () => {
    const text = 'Republic of the Philippines - UNIVERSITY OF CEBU Main Campus Student Identification Card';
    const detection = detectInstitutionalMarkers(text);
    expect(detection.isUcDocument).toBe(true);
    expect(detection.matchedMarkers).toContain('UNIVERSITY OF CEBU');
    expect(detection.matchedMarkers).toContain('MAIN CAMPUS');
  });

  it('should extract candidate student IDs from OCR text', () => {
    const text = 'Student Name: Juan Dela Cruz \n ID: 21560206 \n Semester: 1st 2024-2025';
    const candidates = extractCandidateStudentIds(text);
    expect(candidates).toContain('21560206');
  });

  it('should accurately OCR scan a simulated UC ID card and match student ID', async () => {
    const svg = `
      <svg width="700" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffffff"/>
        <text x="40" y="70" font-family="Arial" font-size="28" font-weight="bold" fill="#002B7F">UNIVERSITY OF CEBU</text>
        <text x="40" y="140" font-family="Arial" font-size="24" fill="#000000">STUDENT ID: 21560206</text>
        <text x="40" y="200" font-family="Arial" font-size="24" fill="#000000">JUAN DELA CRUZ</text>
      </svg>
    `;
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    const result = await verifyStudentDocuments({
      idPhotoUrl: dataUrl,
      studentId: '21560206',
      studentName: 'Juan Dela Cruz'
    });

    expect(result.configured).toBe(true);
    expect(result.isUcDocument).toBe(true);
    expect(result.studentIdFound).toBe(true);
    expect(result.detectedStudentId).toBe('21560206');
    expect(result.autoApprovalEligible).toBe(false); // Stays pending for admin confirmation
  }, 30000);
});
