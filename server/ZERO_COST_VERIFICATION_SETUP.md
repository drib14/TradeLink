# Zero-API-cost student document review

TradeLink uses the existing `tesseract.js` dependency for local, server-side OCR of uploaded student ID images. OCR runs in the backend process; it does not call AWS Rekognition, AWS Textract, or another paid OCR API.

## Current behavior

- The backend normalizes the submitted ID image with Sharp and extracts English text with Tesseract.js.
- OCR compares the extracted text with the submitted student ID and account name.
- OCR is an aid for the campus reviewer, not proof that an ID is genuine.
- No automated face matching or liveness detection is performed.
- Every submission remains pending for authorized campus administrator review. Do not enable automatic approval based on OCR, browser telemetry, image similarity, or a client-side face score.

## Cost and runtime notes

The Tesseract.js library has no per-request API charge. The first OCR run may need to download its language data unless the deployment bundles or caches it. OCR consumes backend CPU and memory, so request limits and realistic image-size limits remain important. Hosting, image storage, bandwidth, and any language-data download may still incur costs.

## Privacy and security

Keep document processing on the server. Restrict access to original student ID images and OCR diagnostics, use HTTPS and private storage, define a retention/deletion period, and obtain appropriate consent. OCR output can be wrong; administrators must inspect the original document and independently compare the student with the submitted selfie or campus records.
