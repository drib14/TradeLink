# TradeLink 🎓

> Verified peer-to-peer student marketplace and barter hub built for the **University of Cebu** campus network.

TradeLink connects students across all 8 UC campuses to buy, sell, swap, and donate textbooks, uniforms, laboratory gear, calculators, and electronics safely. Trades are finalized inside verified campus zones using encrypted 4-digit handshake codes and QR verification.

---

## Key Features

- **🎓 Campus-Restricted Marketplace**: Filter listings by campus (Main, Banilad, LM, METC, PT, South, UCMed, PriMo) and college department.
- **🔄 Multi-Mode Trading**: Buy & sell with student pricing, barters/swaps with cash top-up negotiation, or free donations.
- **🛡️ Secure Campus Handshakes**: In-person meetups verified through one-time 4-digit bcrypt-hashed handshake codes or QR scans.
- **💬 Real-Time Chat & Offers**: WebSocket-powered instant messaging with integrated swap proposal tools and meetup scheduling.
- **⭐ Trust Score Algorithm**: Dynamic reputation score (10–100) based on verified student ID, completed trades, punctuality, and ratings.
- **📱 Cross-Platform**: Responsive Web App (React 19 + Vite), Mobile App (React Native / Expo), and Dedicated Staff Admin Portal.

---

## App Interface Preview

### 1. Marketplace & Campus Feed
```text
┌──────────────────────────────────────────────────────────────────────────┐
│  🎓 TradeLink        [🔍 Search books, scrubs, gadgets...]   [💬 (2)] [👤 Profile] │
├──────────────────────────────────────────────────────────────────────────┤
│  [All Campuses ▼]  [Textbooks]  [Uniforms & Scrubs]  [Electronics]  [More]  │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ 🏷️ Buy / Sell         │  │ 🔄 Swap Eligible     │  │ 🎁 Free Donation     │  │
│  │ Engineering Physics  │  │ CASIO fx-991EX       │  │ Nursing Scrub Top    │  │
│  │ ₱450 · Like New      │  │ Swap for SciCal Plus │  │ ₱0 · Fair Condition  │  │
│  │ 📍 UC Main · Lib 3F  │  │ 📍 UC Banilad · Gate1│  │ 📍 UC Banilad · 2F   │  │
│  │ 👤 Maria S. (98⭐)    │  │ 👤 Kenzo L. (92⭐)   │  │ 👤 Bea R. (88⭐)     │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2. Meetup Scheduling & Encrypted Handshake
```text
┌──────────────────────────────────────────────────────────────────────────┐
│  🤝 Meetup Transaction #TRD-88214                                         │
│  Item: Organic Chemistry (2nd Edition) · ₱350                             │
│  Location: UC Banilad — 3rd Floor Student Lounge (Zone A)                 │
│  Schedule: Today, 3:30 PM PHT                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                 VERIFICATION HANDSHAKE CODE                              │
│                           [ 8 · 4 · 1 · 9 ]                              │
│                                                                          │
│     * Give this code to the seller only after inspecting the item.       │
│     * Code is verified securely against a server-side bcrypt hash.        │
│                                                                          │
│  [ 📱 Scan Buyer QR Code ]                   [ ⚠️ Report Issue / Dispute ]│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
TradeLink/
├── client/              # React 19 + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/  # Marketplace, chat, modals, and common UI
│   │   ├── context/     # Auth, Market, Chat, and Toast state providers
│   │   ├── pages/       # Marketplace, ItemDetail, Meetups, Profile, Admin
│   │   ├── services/    # REST API client services
│   │   └── types/       # Shared TypeScript domain interfaces
│   └── vercel.json      # Production deployment configuration
│
├── admin/               # Administrative dashboard for campus moderators
│   └── src/             # User verification, dispute resolution, flag moderation
│
├── mobile/user/         # Expo / React Native student mobile application
│   ├── app/             # Expo Router file-based screens
│   ├── services/        # Mobile REST API client
│   └── context/         # Mobile Auth & Market providers
│
├── server/              # Node.js / Express REST API + Socket.IO server
│   ├── src/
│   │   ├── config/      # DB connection pool, constants, env validation
│   │   ├── controllers/ # Modular endpoints (Auth, Listings, Swaps, Admin)
│   │   ├── middleware/  # JWT auth, RBAC, XSS sanitization, rate limiters
│   │   ├── routes/      # Express route definitions
│   │   ├── serializers/ # Safe payload transformers (strips hash data)
│   │   └── socket/      # Real-time chat & notifications handlers
│   └── __tests__/       # Security, performance, integration, and unit tests
│
└── DB/
    └── schema.sql       # MySQL database schema (8 UC campuses, 14 tables)
```

---

## Tech Stack

- **Frontend Web**: React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons
- **Mobile**: React Native 0.81, Expo 54, Expo Router, AsyncStorage
- **Backend**: Node.js, Express 4, Knex.js, Socket.IO
- **Database**: MySQL 8.0+
- **Security & Auth**: JWT (Access + Refresh Rotation), Bcrypt (Salt rounds = 12), Helmet, Custom XSS Sanitizer

---

## Quick Start

### Prerequisites
- Node.js `v18.0+`
- MySQL `8.0+`
- npm `v9.0+`

### 1. Clone & Setup Database
```bash
# Import the database schema into your local MySQL server
mysql -u root -p < DB/schema.sql
```

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Database Config
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tradelink_db

# Security Secrets (Use 64+ char random keys in production)
JWT_ACCESS_SECRET=your_jwt_access_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Install & Start Backend
```bash
cd server
npm install
npm run dev
# Server running at http://localhost:3001
```

### 4. Start Frontend Web Client
```bash
cd client
npm install
npm run dev
# Web app running at http://localhost:5173
```

### 5. Start Mobile App (Optional)
```bash
cd mobile/user
npm install
npm start
# Scan QR code in Expo Go app (Android/iOS)
```

---

## Running the Automated Test Suite

TradeLink includes an extensive automated test suite covering security vulnerabilities, RBAC enforcement, query efficiency, and business logic.

```bash
# Run all server tests (12 suites, 41 tests)
cd server
npm test

# Run specific test suites
npm run test:security     # JWT forgery, XSS injection, SQL LIKE escaping, headers
npm run test:integration  # Admin routes & RBAC role guards
npm run test:unit         # Joi validations, Trust Score algorithm, Serializers
npm run test:perf         # Query batching (N+1 avoidance) & connection pool config

# Run mobile app test suite
cd mobile/user
npm test
```

---

## Campus Locations Covered

| Campus Code | Campus Name | Location |
| :--- | :--- | :--- |
| `UC Main` | **University of Cebu - Main Campus** | Sanciangko St, Cebu City |
| `UC Banilad` | **University of Cebu - Banilad Campus** | Gov. M. Cuenco Ave, Banilad |
| `UC LM` | **University of Cebu - Lapu-Lapu & Mandaue** | A.C. Cortes Ave, Mandaue |
| `UC METC` | **University of Cebu - METC Campus** | Alumnos St, Mambaling |
| `UC PT` | **University of Cebu - Pardo-Talisay** | Bulacao, Pardo, Cebu City |
| `UC South` | **University of Cebu - South Campus** | Sanciangko St, Cebu City |
| `UC UCMed` | **University of Cebu - Medical Center** | Subangdaku, Mandaue City |
| `UC PriMo` | **University of Cebu - PriMo Campus** | Cebu City |

---

## Security Architecture

- **Encrypted Handshake Verification**: Verification codes are never saved in plain text; they are generated on demand and stored exclusively as bcrypt hashes (`verification_code_hash`).
- **Input Sanitization**: Custom recursive sanitizer scrubs `<script>` tags, HTML attributes, and prevents prototype pollution (`__proto__`, `constructor`).
- **Parameterized Queries**: All database operations use Knex.js parameterized queries with explicit wildcard escaping on LIKE filters.
- **Strict Role-Based Access**: Student and Admin roles strictly separated with endpoint-level permission guards.
- **WebSocket Throttling**: Chat channels rate-limited to 30 messages/minute per socket connection.

---

## License

TradeLink is proprietary software developed for educational and campus commerce purposes within the University of Cebu community.
