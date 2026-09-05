# TradeLink Administration & Moderation Portal (Frontend UI/UX)

This directory is strictly a **standalone React + TypeScript + Vite frontend application** dedicated to the University of Cebu TradeLink Administration Portal.

## Architecture
- **Port**: `5174` (Dev server)
- **Backend API**: All backend endpoints, controllers, models, and databases strictly reside in `../server` (Port `3001`).
- **Student Portal**: Student marketplace application strictly resides in `../client` (Port `5173`).

## Key Features
- **Admin Authentication Gate**: Secure email login (`uc.tradelink@gmail.com`) with direct OTP forgot-password dispatch (no admin approval required).
- **KYC Biometric Verification Desk**: High-resolution side-by-side inspection of student IDs vs. optical liveness selfie captures, with one-click approval and preset rejection reasons (blur, glare, expired, face mismatch).
- **Marketplace Moderation**: Live prohibited keyword scanning, listing take-down, and flagged listing resolution.
- **Campus Safety & Dispute Resolution**: Meetup monitor and dispute arbitration.
- **User & Trust Management**: Trust score adjustment, warning issuance, and student ban controls.
- **Campus Bulletin**: Broadcast announcements across UC campuses.

## Scripts
- `npm run dev`: Start Vite dev server on port `5174`.
- `npm run build`: Typecheck and produce optimized production bundle in `dist/`.
