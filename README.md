# TradeLink

A campus marketplace for University of Cebu students. TradeLink lets students buy, sell, swap, and give away items within the UC community.

## Live Demo

Visit the live TradeLink platform: [uc-tradelink.vercel.app](https://uc-tradelink.vercel.app/)

## What it includes

- **Student marketplace** for books, uniforms, school supplies, gadgets, and other permitted items
- **Buy, sell, swap, and free listings**
- **Campus-based browsing** and listing filters
- **Student accounts and ID verification**
- **Chat, offers, and meetup coordination**
- **QR/code-assisted meetup verification**
- **Admin dashboard** for account and listing moderation
- **Mobile app** built with Expo

## Project apps

| Folder | Purpose | Main tools |
|---|---|---|
| `client/` | Student web app | React, TypeScript, Vite |
| `admin/` | Admin dashboard | React, TypeScript, Vite |
| `server/` | API and real-time services | Node.js, Express, Knex, Socket.IO |
| `mobile/user/` | Student mobile app | React Native, Expo |
| `DB/` | SQL schema and database scripts | MySQL |

## Run locally

### Requirements

- Node.js and npm
- MySQL
- Git

### 1. Get the code

```bash
git clone https://github.com/drib14/TradeLink.git
cd TradeLink
```

### 2. Install dependencies

```bash
npm install --prefix server
npm install --prefix client
```

For the optional admin portal, also run:

```bash
npm install --prefix admin
```

### 3. Configure environment files

Copy the examples to local, untracked environment files:

- `server/.env.example` → `server/.env`
- `client/.env.example` → `client/.env`
- `admin/.env.example` → `admin/.env` (optional)

Set your local MySQL credentials and strong development secrets in `server/.env`. Set `PORT=3001` there unless you need another port.

The client and admin apps should use `VITE_API_BASE_URL=/api`. Their Vite proxy reads the backend `HOST` and `PORT` from `server/.env`; set `VITE_API_PROXY_TARGET` in the relevant frontend `.env` only if you need to override that target.

**Never put database credentials, JWT secrets, email passwords, Cloudinary secrets, or provider API keys in client/admin `.env` files or in any variable prefixed with `VITE_`.** Vite exposes `VITE_` values to the browser. Keep all secrets in `server/.env`.

### 4. Create the database

Make sure your local MySQL service is running and the configured database exists. Then run:

```bash
npm run migrate:latest --prefix server
```

### 5. Start backend and student frontend together

From the repository root:

```bash
npm run dev
```

The launcher starts the Express backend first, waits until its root health endpoint responds, and then starts the student Vite app. Open [http://localhost:5173](http://localhost:5173).

If the backend does not become healthy, check the backend terminal output and verify `server/.env` has the intended `PORT`. Database-backed routes also require MySQL to be running and configured correctly.

To start either process separately, use:

```bash
npm run dev:server
npm run dev:client
```

### 6. Start the admin dashboard (optional)

In another terminal:

```bash
npm run dev:admin
```

Open [http://localhost:5174](http://localhost:5174).

### 7. Start the mobile app (optional)

```bash
cd mobile/user
npm install
npm start
```

Use Expo Go or an available simulator to open the app.

## Useful commands

Run these from the repository root unless noted.

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend and student frontend together |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start student frontend only |
| `npm run dev:admin` | Start admin dashboard |
| `npm run check:secrets` | Scan tracked files for exposed secrets |
| `npm run migrate:latest --prefix server` | Apply database migrations |
| `npm test --prefix server` | Run backend tests |
| `npm run build --prefix client` | Build student web app |
| `npm run build --prefix admin` | Build admin dashboard |

## Configuration notes

- Backend environment variables are documented in `server/.env.example`.
- Frontend environment examples contain only public, non-secret settings.
- Local `.env` files and new runtime uploads are excluded from Git. Files already tracked by Git remain tracked until explicitly removed.
- Use a managed database for deployed environments; local MySQL settings are for development only.
- Never use production credentials or real student data in local development or tests.

## Repository layout

```text
TradeLink/
├── admin/          # Admin web dashboard
├── client/         # Student web application
├── mobile/user/    # Student mobile application
├── server/         # Express API and Socket.IO server
└── DB/             # MySQL schema and database documentation
```

## Contributing

1. Create a branch for your change.
2. Keep changes focused and follow the existing project structure.
3. Run the relevant tests or build before opening a pull request.
4. Never commit secrets, private keys, database dumps, runtime uploads, or real student documents.

## License

This repository is intended for the TradeLink project and University of Cebu community. See the repository owner for usage and permissions.
