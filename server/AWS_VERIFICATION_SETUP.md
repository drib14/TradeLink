# AWS student verification setup

TradeLink's server-side verification can use Amazon Rekognition and Amazon Textract to compare the ID-card portrait with a separately submitted selfie and read the ID document.

## Backend configuration

Set the following environment variable in the backend deployment:

```env
AWS_REGION=ap-southeast-1
```

Use the AWS SDK default credential provider chain. Prefer an attached IAM role (for example, an ECS task role, EC2 instance profile, or Lambda execution role). If the hosting platform cannot attach a role, configure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as backend-only secrets. Never add AWS credentials to Vite/client environment variables or commit them to Git.

The IAM principal needs only these actions for the current implementation:

- `rekognition:CompareFaces`
- `textract:DetectDocumentText`

The selected AWS region must support both services.

## Current behavior and approval safety

- Rekognition performs a server-side face comparison with a 90% similarity threshold.
- Textract extracts document text; the service checks for the submitted student ID and account name.
- Browser-provided face-match and liveness scores are not trusted for approval.
- If AWS is not configured, the ID/selfie is missing, OCR cannot confirm the submitted details, or an AWS request fails, the request remains pending for campus review.
- **Automatic approval is intentionally fail-closed.** CompareFaces and OCR do not prove that the selfie came from a live camera capture. The current capture UI uses browser-side liveness signals, which are not authoritative. Do not enable automatic approval until AWS Rekognition Face Liveness (including its capture UI and server-side session-result verification) is implemented and tested.

This implementation requires the student ID and a separate selfie to be submitted as data URLs. A Certificate of Registration can still be submitted for manual review, but is not treated as a selfie.

## Operational notes

AWS Rekognition and Textract process sensitive student identity and biometric information. Obtain appropriate consent, document the purpose and retention period, restrict IAM and operator access, and configure deletion/retention controls for source images and derived verification data. Review AWS regional availability, pricing, and applicable privacy requirements before production use.
