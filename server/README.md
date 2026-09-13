# TradeLink Backend API & Database

Production-ready **Node.js + Express + MySQL 8.0** backend with **Socket.IO** real-time messaging, JWT authentication, and enterprise-grade security for the University of Cebu Student Marketplace & Barter Hub.

---

## 🛠️ Tech Stack & Architecture

- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.x
- **Database**: MySQL 8.0 (Relational schema with 22 tables, foreign keys, indexes, and fulltext search)
- **Query Builder & Migrations**: Knex.js (`mysql2` driver)
- **Real-Time WebSocket**: Socket.IO 4.x
- **Authentication**: JWT (Stateless access tokens in memory + rotating refresh tokens in HttpOnly secure cookies) + `bcryptjs` password hashing (salt 12)
- **Validation**: Joi
- **Security Suite**: Helmet, CORS whitelist, Express Rate Limit, HPP, XSS sanitization, timing-safe code verification

---

## 📁 Directory Layout

```
server/
├── package.json
├── knexfile.js              # Knex database configuration
├── .env.example             # Environment variable template
├── .env                     # Local environment config
├── migrations/              # Database schema migrations
│   └── 20260828000000_create_all_tables.js
├── seeds/                   # Sample data seed script
│   └── 001_seed_all.js
├── uploads/                 # Storage for listing photos, avatars, and ID verification photos
└── src/
    ├── index.js             # Main server bootstrap + Socket.IO initialization
    ├── config/              # Environment, DB pool, and CORS configs
    ├── middleware/          # JWT auth, RBAC, Rate Limiting, Joi validation, Multer, Error handler
    ├── utils/               # AppError, asyncHandler, logger, code generator
    ├── validations/         # Joi validation schemas for all domains
    ├── services/            # Email (Nodemailer), Trust Score algorithm, Price Advisor
    ├── controllers/         # Business logic handlers
    ├── routes/              # Express API route endpoints
    └── socket/              # Real-time chat & notification event handlers
```

---

## 🚀 Getting Started

### 1. Configure MySQL Database
Make sure your MySQL 8.0 server is running (via XAMPP, Docker, or native service).
Create the database:
```sql
CREATE DATABASE tradelink_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Or import `../DB/schema.sql` and `../DB/seed.sql`.

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tradelink_db_test

JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CLIENT_URL=http://localhost:5173
```

### 3. Run Migrations and Seed Data
```bash
# Run migrations to create all 22 tables
npm run migrate:latest

# Populate UC student accounts, listings, meetups, etc.
npm run seed:run
```

### 4. Start Server
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001` with base API route at `http://localhost:3001/api`.

---

## 🔒 Security Architecture Highlights

1. **Password Security**: Passwords hashed with `bcrypt` (12 rounds).
2. **Double Token Auth**:
   - Access Token: short-lived (15 mins), passed via `Authorization: Bearer <token>`
   - Refresh Token: 7-day token stored in an `HttpOnly`, `SameSite=Strict`, `Secure` cookie and hashed in MySQL for instant revocation.
3. **Role-Based Access Control (RBAC)**:
   - `student`: Buy, sell, swap, chat, submit reviews, manage own listings
   - `admin`: Moderation desk, dispute resolutions, ID verification reviews, campus bulletin, system config, feature flags, user moderation
4. **Anti-Brute Force Rate Limiting**:
   - `/api/auth/login`: max 10 requests per 15 mins per IP
   - `/api/auth/forgot-password`: max 5 requests per hour
   - `/api/listings` creation: max 20 posts per hour
   - General API: max 120 requests per minute
5. **Data Protection**:
   - 4-digit Handshake QR verification codes are hashed and verified with timing-safe comparisons (`verifyCode`).
   - XSS sanitization and HTTP Parameter Pollution (`hpp`) prevention.
   - Comprehensive audit logging (`admin_audit_logs`) tracking IP address and user agents on every administrative action.

---

## 📡 REST API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student account
- `POST /api/auth/login` — Login & receive JWT access + refresh tokens
- `POST /api/auth/refresh-token` — Rotate and issue fresh access token
- `POST /api/auth/logout` — Revoke refresh token and clear cookie
- `POST /api/auth/forgot-password` — Send 4-digit reset code
- `POST /api/auth/reset-password` — Verify code & set new password
- `GET /api/auth/me` — Current authenticated user session

### User Profiles (`/api/users`)
- `GET /api/users/:id` — View student public profile, listings, and reviews
- `PATCH /api/users/me` — Update bio, avatar, campus, college
- `POST /api/users/me/verify-id` — Upload student ID photo for badge verification
- `GET /api/users/:id/reviews` — Get reviews and badge endorsements

### Marketplace Listings (`/api/listings`)
- `GET /api/listings` — Query catalog with filters (campus, category, tradeMode, condition, search, price range, sorting, pagination)
- `GET /api/listings/:id` — Detailed listing view (increments views count)
- `POST /api/listings` — Create listing (requires student ID verification)
- `PATCH /api/listings/:id` — Update listing details
- `DELETE /api/listings/:id` — Delete listing
- `PATCH /api/listings/:id/sold` — Mark as sold or available
- `POST /api/listings/:id/report` — Flag suspicious item for admin moderation

### Guarded Campus Meetups (`/api/meetups`)
- `GET /api/meetups` — Get active & completed meetups
- `POST /api/meetups` — Schedule meetup with generated 4-digit code
- `POST /api/meetups/:id/verify` — Scan QR / enter 4-digit code to complete transaction
- `PATCH /api/meetups/:id/status` — Update status (`on_the_way`, `cancelled`)

### Barter & Swaps (`/api/swaps`)
- `GET /api/swaps` — View incoming & outgoing swap proposals
- `POST /api/swaps` — Propose item barter with optional cash top-up
- `PATCH /api/swaps/:id/respond` — Accept or decline offer

### Chat & Messaging (`/api/chat`)
- `GET /api/chat/conversations` — View conversation threads with last message & unread badge
- `GET /api/chat/conversations/:id/messages` — Message history
- `POST /api/chat/messages` — Send message (REST fallback)

### Wanted Board (`/api/wanted`)
- `GET /api/wanted` — List campus wanted requests
- `POST /api/wanted` — Post wishlist item
- `POST /api/wanted/:id/respond` — Offer item to requester
- `PATCH /api/wanted/:id/fulfill` — Mark request fulfilled

### Reviews & Ratings (`/api/reviews`)
- `POST /api/reviews` — Submit 5-star rating, punctuality report, and trait badges

### Notifications (`/api/notifications`)
- `GET /api/notifications` — Get in-app alerts
- `PATCH /api/notifications/:id/read` — Mark read
- `PATCH /api/notifications/read-all` — Mark all read

### Admin Desk (`/api/admin`)
- `GET /api/admin/stats` — Platform metrics overview
- `GET /api/admin/verifications` — Pending student ID submissions
- `PATCH /api/admin/verifications/:id/approve` — Grant verification badge & trust score bonus
- `PATCH /api/admin/verifications/:id/reject` — Decline submission
- `GET /api/admin/flags` — Flagged listings queue
- `PATCH /api/admin/flags/:id/resolve` — Mark listing safe
- `DELETE /api/admin/flags/:id/remove` — Delete listing for policy breach
- `GET /api/admin/disputes` — Active transaction dispute cases
- `PATCH /api/admin/disputes/:id/resolve` — Issue verdict (refund, warning, dismissal, account ban)
- `GET /api/admin/announcements` — Campus bulletin list
- `POST /api/admin/announcements` — Create announcement
- `GET /api/admin/audit-logs` — Administrative audit trail with IP addresses
- `GET /api/admin/users` — Student directory with warning and ban tools
- `PATCH /api/admin/users/:id/ban` — Suspend account
- `PATCH /api/admin/users/:id/unban` — Restore account
-`PATCH /api/admin/users/:id/warn` — Issue official strike
- `DELETE /api/admin/users/:id` — Delete account (Admin)
- `GET /api/admin/config` — System platform parameters
- `PATCH /api/admin/config` — Update system rules & price ceilings
- `PATCH /api/admin/feature-flags/:id/toggle` — Toggle live feature flags

---

## ⚡ Socket.IO Real-Time Events

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `chat:join` | Client -> Server | `{ conversationId }` | Join private conversation room |
| `chat:leave` | Client -> Server | `{ conversationId }` | Leave conversation room |
| `chat:message` | Bidirectional | `{ conversationId, receiverId, content, isSystemMessage, swapOfferId }` | Broadcast instant message |
| `chat:typing` | Bidirectional | `{ conversationId, isTyping }` | Live typing indicator |
| `chat:read` | Bidirectional | `{ conversationId }` | Mark messages read in real-time |
| `notification:new` | Server -> Client | `{ title, message, type, ... }` | Push notification delivery |
