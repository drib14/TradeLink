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
    Client["Student Web App (Vercel)<br/>https://tradelink-uc.vercel.app"] -->|REST / HTTPS| Render["TradeLink API Server (Render)<br/>https://tradelink-api.onrender.com"]
    Client -->|WebSockets (wss://)| Render
    Admin["Admin Portal (Vercel)<br/>https://tradelink-admin.vercel.app"] -->|REST / HTTPS| Render
    Render -->|SSL Encrypted Pool (3306)| DB[(Managed MySQL 8.0<br/>Aiven / Railway / TiDB)]
    Render -->|SMTP (Port 465 SSL)| Gmail["Gmail SMTP<br/>uc.tradelink@gmail.com"]
    Render -->|Direct Uploads SDK| Cloudinary["Cloudinary CDN<br/>Images & Biometrics"]
```

---

## 💾 1. Recommended Database Deployment

Because the backend is hosted on **Render** (which does not provide a managed MySQL service natively on its free tier), you need an external MySQL 8.0 database accessible over the internet with SSL.

### 🏆 Top Recommendation: Aiven for MySQL
- **Website**: [https://aiven.io/mysql](https://aiven.io/mysql)
- **Why it's best for TradeLink**:
  - **Singapore Region (`ap-southeast-1`)**: Nearest data center to Cebu, Philippines, delivering low network latency (<40ms).
  - **Native MySQL 8.0**: 100% binary compatibility with all TradeLink JSON columns, check constraints, and fulltext indexes.
  - **Automated SSL/TLS**: Pre-configured SSL certificates.
  - **Daily Automated Backups**: Point-in-time recovery.
  - **Free Trial**: $300 free credits or free tier plan.

#### Setup Steps on Aiven:
1. Create a free account at [aiven.io](https://aiven.io).
2. Click **Create Service** → Select **MySQL**.
3. Choose cloud provider **AWS** or **Google Cloud**, and select region **Singapore (`ap-southeast-1`)**.
4. Select the **Free** or **Startup** plan.
5. In your service dashboard, note your:
   - **Host** (e.g. `mysql-xxxxxx.aivencloud.com`)
   - **Port** (e.g. `12345`)
   - **User** (default `avnadmin`)
   - **Password**
   - **Service URI** (looks like `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`)
6. Download the **CA Certificate** (`ca.pem`) if connecting via Workbench/CLI, or use the connection URI directly with `DB_SSL=true`.

### 🥈 Alternative 1: Railway MySQL
- **Website**: [https://railway.app](https://railway.app)
- **Setup**: Click **New Project** → **Provision MySQL** → Click on the MySQL service → **Variables** → Copy `DATABASE_URL`.
- **Note**: Ensure you use the Public TCP proxy domain (`roundhouse.proxy.rlwy.net`) when connecting from outside Railway.

### 🥉 Alternative 2: TiDB Cloud (Serverless)
- **Website**: [https://tidbcloud.com](https://tidbcloud.com)
- **Setup**: Create a **Serverless Tier** cluster (permanently free 5GB) in **Singapore** or **Tokyo**. TiDB is wire-compatible with MySQL 8.0.

---

## 🗄️ 2. Database Schema Initialization & Seeding

Once your database is created, run the schema creation and clean seed scripts.

### Option A: Using MySQL CLI
```bash
mysql -h <YOUR_DB_HOST> -P <YOUR_DB_PORT> -u <YOUR_DB_USER> -p <YOUR_DB_NAME> < DB/schema.sql
mysql -h <YOUR_DB_HOST> -P <YOUR_DB_PORT> -u <YOUR_DB_USER> -p <YOUR_DB_NAME> < DB/seed.sql
```

### Option B: Using Knex Migrations (Automated from `server/`)
In your terminal, set your production `DATABASE_URL` and run:
```bash
cd server
npm install
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>" DB_SSL=true npx knex migrate:latest
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<dbname>" DB_SSL=true npx knex seed:run
```

> [!NOTE]
> The database initialization seeds **ONLY** the initial administrator account (`ADMIN001` configured via `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `.env`), system safety rules, and baseline announcements. It contains **zero dummy students** and **zero mock listings**.

---

## 🚀 3. Backend Deployment on Render

### Step 1: Connect Repository to Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `drib14/TradeLink`.

### Step 2: Configure Service Settings
- **Name**: `tradelink-api`
- **Region**: `Singapore (Southeast Asia)`
- **Branch**: `main` (or your active branch)
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/index.js`
- **Health Check Path**: `/api/health`

### Step 3: Configure Environment Variables on Render
Under the **Environment** tab of your Web Service, add the following variables:

| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & security checks |
| `PORT` | `3001` | Internal server listen port |
| `DATABASE_URL` | `mysql://avnadmin:<pwd>@<host>:<port>/defaultdb` | Connection string to your cloud MySQL |
| `DB_SSL` | `true` | Enforce SSL database connection |
| `JWT_ACCESS_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for signing student access tokens |
| `JWT_REFRESH_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for signing student refresh tokens |
| `JWT_ADMIN_ACCESS_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for signing admin access tokens |
| `JWT_ADMIN_REFRESH_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for signing admin refresh tokens |
| `COOKIE_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for signing HTTP cookies |
| `VERIFICATION_SESSION_SECRET` | *(Click "Generate" or 64-char hex string)* | Secret for biometric session tokens |
| `CLIENT_URL` | `https://<your-client-app>.vercel.app` | Comma-separated allowed frontend origins |
| `ADMIN_URL` | `https://<your-admin-app>.vercel.app` | Comma-separated allowed admin origins |
| `APP_URL` | `https://<your-client-app>.vercel.app` | Base URL used in student email CTA links |
| `ADMIN_APP_URL` | `https://<your-admin-app>.vercel.app` | Base URL used in admin email CTA links |
| `ALLOW_VERCEL_PREVIEWS` | `true` | Allows preview PR deployments (`*.vercel.app`) |
| `COOKIE_SAME_SITE` | `none` | **Critical for cross-origin cookies between Vercel & Render** |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP host |
| `SMTP_PORT` | `465` | SSL Port |
| `SMTP_USER` | `your_email@gmail.com` | Official TradeLink sender Gmail address |
| `SMTP_PASS` | `your_16_char_app_password` | Google App Password (16 characters) |
| `SMTP_FROM` | `TradeLink Marketplace <noreply@yourdomain.com>` | Sender display header |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_cloud_name` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | `your_cloudinary_api_key` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_api_secret` | Cloudinary API Secret |
| `DAILY_UPLOAD_QUOTA_MB` | `50` | Per-user daily upload limit |

> [!IMPORTANT]
> Because the backend is hosted on Render (`onrender.com`) and the frontends on Vercel (`vercel.app`), they are cross-domain. Setting `COOKIE_SAME_SITE=none` ensures browsers accept the `refreshToken` and `XSRF-TOKEN` cookies.

---

## ⚡ 4. Client Deployment on Vercel (Student Web App)

### Step 1: Create Project on Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import repository `drib14/TradeLink`.

### Step 2: Project Settings
- **Project Name**: `tradelink-client` (or `tradelink-uc`)
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and choose `client`.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Environment Variables
Add the following in **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<your-render-service>.onrender.com` |

*(Optional: If `client/vercel.json` rewrite proxy is used, you can leave `VITE_API_BASE_URL` blank and it will automatically proxy `/api/*` through Vercel's edge network to Render.)*

### Step 4: Deploy
Click **Deploy**. Vercel will build and assign your domain (e.g. `https://tradelink-client.vercel.app`).

---

## 🛡️ 5. Admin Portal Deployment on Vercel

### Step 1: Create Second Project on Vercel
1. In your Vercel Dashboard, click **Add New...** → **Project**.
2. Select the same repository `drib14/TradeLink`.

### Step 2: Project Settings
- **Project Name**: `tradelink-admin`
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and select `admin`.
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Environment Variables
Add in **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |

### Step 4: Deploy
Click **Deploy**. Vercel will provide your admin URL (e.g. `https://tradelink-admin.vercel.app`).

---

## 🔄 6. Post-Deployment Coordination

After both Vercel apps are deployed:
1. Copy the **Client URL** (e.g. `https://tradelink-client.vercel.app`).
2. Copy the **Admin URL** (e.g. `https://tradelink-admin.vercel.app`).
3. In your **Render Dashboard** → `tradelink-api` service → **Environment**:
   - Update `CLIENT_URL` to `https://tradelink-client.vercel.app`
   - Update `APP_URL` to `https://tradelink-client.vercel.app`
   - Update `ADMIN_URL` to `https://tradelink-admin.vercel.app`
   - Update `ADMIN_APP_URL` to `https://tradelink-admin.vercel.app`
4. Render will trigger a quick redeploy with the updated CORS whitelist.

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
