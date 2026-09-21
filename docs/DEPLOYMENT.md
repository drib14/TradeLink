# TradeLink Production Deployment Guide

This guide details the complete production deployment procedure for the **University of Cebu TradeLink** ecosystem:
- **Client Web App (Students)**: [Vercel](https://vercel.com)
- **Admin Portal (Moderation Desk)**: [Vercel](https://vercel.com)
- **Backend API & WebSockets Server**: [Render](https://render.com)
- **Production Database**: Managed Cloud MySQL 8.0 ([Aiven](https://aiven.io), [Railway](https://railway.app), or [TiDB Cloud](https://tidbcloud.com))

---

## 🏛️ System Topology

```mermaid
graph TD
    Client["Student Web App (Vercel)<br/>https://uc-tradelink.vercel.app"] -->|REST / HTTPS| VercelAPI["TradeLink API Server (Vercel)<br/>https://tradelink-backend.vercel.app"]
    Admin["Admin Portal (Vercel)<br/>https://tradelink-admin.vercel.app"] -->|REST / HTTPS| VercelAPI
    VercelAPI -->|SSL Encrypted Pool (4000/3306)| DB[(Managed MySQL 8.0 / TiDB Cloud<br/>gateway01.ap-southeast-1...)]
    VercelAPI -->|SMTP (Port 465 SSL)| Gmail["Gmail SMTP<br/>uc.tradelink@gmail.com"]
    VercelAPI -->|Direct Uploads SDK| Cloudinary["Cloudinary CDN<br/>Images & Biometrics"]
```

---

## 💾 1. Recommended Database Deployment

TradeLink uses a managed cloud MySQL 8.0 database (such as **TiDB Cloud Serverless**, **Aiven**, or **Railway**).

### 🏆 Configured Database: TiDB Cloud (Serverless)
- **Region**: Singapore (`ap-southeast-1`) — optimal latency for Philippines/Southeast Asia.
- **SSL**: Enforced (`DB_SSL=true`).
- **Connection URI Format**:
  `mysql://<user>:<password>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/tradelink_db`

---

## 🚀 2. Backend API Deployment on Vercel (`tradelink-backend`)

The TradeLink server is pre-configured with a Vercel Serverless Function entrypoint ([server/api/index.js](file:///c:/Users/jhond/Documents/TradeLink/server/api/index.js)) and rewrite rules ([server/vercel.json](file:///c:/Users/jhond/Documents/TradeLink/server/vercel.json)).

### Step 1: Create Backend Project on Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select your GitHub repository: `drib14/TradeLink`.

### Step 2: Configure Project Settings
- **Project Name**: `tradelink-backend`
- **Framework Preset**: Select **Other**
- **Root Directory**: Click **Edit** and choose `server`
- **Build Command**: Leave empty / default (Vercel automatically packages Node.js functions)
- **Output Directory**: Leave empty / default
- **Install Command**: `npm install`

### Step 3: Configure Environment Variables on Vercel
In the project configuration screen (or under **Settings** → **Environment Variables**), add the following environment variables:

| Variable | Recommended / Production Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production security checks & optimizations |
| `DATABASE_URL` | `mysql://<db_user>:<db_password>@<tidb_host>:4000/<db_name>` | TiDB Cloud connection URI |
| `DB_SSL` | `true` | Enforce TLS 1.2+ database encryption |
| `JWT_ACCESS_SECRET` | `<generated_64_char_hex_secret>` | Student JWT access signing secret |
| `JWT_REFRESH_SECRET` | `<generated_64_char_hex_secret>` | Student JWT refresh signing secret |
| `JWT_ADMIN_ACCESS_SECRET` | `<generated_64_char_hex_secret>` | Admin JWT access signing secret |
| `JWT_ADMIN_REFRESH_SECRET` | `<generated_64_char_hex_secret>` | Admin JWT refresh signing secret |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifespan |
| `COOKIE_SECRET` | `<generated_64_char_hex_secret>` | Signed cookie secret |
| `VERIFICATION_SESSION_SECRET` | `<generated_64_char_hex_secret>` | Biometric session secret |
| `CLIENT_URL` | `https://uc-tradelink.vercel.app` | Allowed client origin(s) for CORS |
| `ADMIN_URL` | `https://tradelink-admin.vercel.app` | Allowed admin origin(s) for CORS |
| `APP_URL` | `https://uc-tradelink.vercel.app` | Base URL used in student email links |
| `ADMIN_APP_URL` | `https://tradelink-admin.vercel.app` | Base URL used in admin email links |
| `BACKEND_URL` | `https://tradelink-backend.vercel.app` | Backend base URL |
| `ALLOW_VERCEL_PREVIEWS` | `true` | Allows preview PR branches (`*.vercel.app`) |
| `COOKIE_SAME_SITE` | `none` | Cross-origin cookie policy for Vercel subdomains |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP host |
| `SMTP_PORT` | `465` | SSL SMTP port |
| `SMTP_USER` | `your-email@gmail.com` | Official TradeLink Gmail sender |
| `SMTP_PASS` | `<your_google_app_password>` | 16-character Google App Password |
| `SMTP_FROM` | `TradeLink Marketplace <your-email@gmail.com>` | Sender header |
| `SUPPORT_EMAIL` | `your-email@gmail.com` | Support contact email |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary storage account |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `<your_cloudinary_api_secret>` | Cloudinary API Secret |
| `DAILY_UPLOAD_QUOTA_MB` | `50` | Daily upload limit per student |
| `ADMIN_SEED_EMAIL` | `admin@tradelink.ph` | Initial administrator account email |
| `ADMIN_SEED_PASSWORD` | `<your_strong_admin_password>` | Initial administrator account password |
| `ADMIN_SEED_NAME` | `TradeLink Community Moderation` | Administrator display name |

### Step 4: Deploy and Verify
1. Click **Deploy**. Vercel will build the serverless package and assign your production URL (`https://tradelink-backend.vercel.app`).
2. Test health: Open `https://tradelink-backend.vercel.app/api/health` in your browser. You should receive:
   ```json
   { "status": "ok" }
   ```

---

## ⚡ 3. Client Deployment on Vercel (`uc-tradelink`)

### Step 1: Configure / Verify Project on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Select your `uc-tradelink` project (or import `drib14/TradeLink` with Root Directory: `client`).
3. Set **Framework Preset**: `Vite`, **Root Directory**: `client`.

### Step 2: Environment Variables
Under **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://tradelink-backend.vercel.app/api` |
| `VITE_SOCKET_URL` | `https://tradelink-backend.vercel.app` |
| `VITE_ADMIN_URL` | `https://tradelink-admin.vercel.app` |
| `VITE_CLIENT_URL` | `https://uc-tradelink.vercel.app` |

Click **Save** and trigger a **Redeploy** to ensure the build embeds the new Vercel server URL.

---

## 🛡️ 4. Admin Portal Deployment on Vercel (`tradelink-admin`)

### Step 1: Configure / Verify Project on Vercel
1. Select your `tradelink-admin` project (or import `drib14/TradeLink` with Root Directory: `admin`).
2. Set **Framework Preset**: `Vite`, **Root Directory**: `admin`.

### Step 2: Environment Variables
Under **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://tradelink-backend.vercel.app/api` |
| `VITE_CLIENT_URL` | `https://uc-tradelink.vercel.app` |
| `VITE_ADMIN_URL` | `https://tradelink-admin.vercel.app` |

Click **Save** and trigger a **Redeploy**.

---

## 🔄 5. Decommissioning Render & Final Coordination

Once your `tradelink-server` Vercel deployment is active:

1. **Verify Vercel Server Health**:
   Visit `https://<your-server-domain>.vercel.app/api/health` — it should return:
   ```json
   { "status": "ok" }
   ```
2. **Update Server CORS Whitelist**:
   In your `tradelink-server` Vercel project **Settings** → **Environment Variables**:
   - `CLIENT_URL`: `https://<your-client-domain>.vercel.app`
   - `ADMIN_URL`: `https://<your-admin-domain>.vercel.app`
   - `APP_URL`: `https://<your-client-domain>.vercel.app`
   - `ADMIN_APP_URL`: `https://<your-admin-domain>.vercel.app`
   Trigger a Redeploy of the server to apply the updated CORS origins.
3. **Shutdown / Decommission Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click on your `tradelink-api` service.
   - Navigate to **Settings** (left sidebar).
   - Scroll to the bottom of the page:
     - Click **Suspend Service** (pauses the service immediately so no resources or spin-up time is consumed), OR
     - Click **Delete Service** (permanently deletes the Render service).
   - Render is now completely decommissioned, and your entire TradeLink architecture (Client, Admin, Server) runs 100% on Vercel!

---

## 📧 7. Dynamic Email Link Architecture

The email service has been built to guarantee that **transaction and reset email CTA buttons never resolve to `localhost` in production**:

```
Resolution Order for Email Action Links:
  1. Incoming HTTP Request 'Origin' or 'Referer' header (if valid live domain)
  2. APP_URL environment variable
  3. First non-localhost domain in CLIENT_URL
  4. Safe fallback: https://tradelink-uc.vercel.app
```

Whenever a student creates a deal, completes an order, or requests a password reset, the email includes a direct live link:
- **Order Created (Buyer & Seller)**: `${appUrl}/transactions?id=TL-2026-XXXX`
- **Order Status Update**: `${appUrl}/transactions?id=TL-2026-XXXX`
- **Password Reset**: `${appUrl}` (pre-loads verification screen)

---

## 🔑 8. Initial Administrator Credentials

Once deployment is complete, log in to the admin portal using the pre-seeded master administrator:

| Field | Configuration / Value |
|---|---|
| **Portal URL** | `https://<your-admin-app>.vercel.app` |
| **Email** | Configured via `ADMIN_SEED_EMAIL` in `.env` |
| **Admin ID Number** | `ADMIN001` |
| **Default Password** | Configured via `ADMIN_SEED_PASSWORD` in `.env` |
| **Role** | Community Moderation & Safety Desk |

> [!CAUTION]
> After logging in for the first time, change the administrator password from the Admin Portal Settings to ensure maximum security.
