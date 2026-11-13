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

### 2. Set up the backend

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, then set your local database details and required secrets. Do not commit your real `.env` file.

Create the database and tables using the project's migrations:

```bash
npm run migrate:latest
```

Start the API:

```bash
npm run dev
```

The local API runs at `http://localhost:3001` (unless you configure a different port).

### 3. Start the student web app

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Vite prints the local web address in the terminal, usually `http://localhost:5173`.

### 4. Start the admin dashboard (optional)

Open another terminal:

```bash
cd admin
npm install
npm run dev
```

### 5. Start the mobile app (optional)

```bash
cd mobile/user
npm install
npm start
```

Use Expo Go or an available simulator to open the app.

## Useful commands

Run these from the relevant project folder.

| Project | Command | Purpose |
|---|---|---|
| Server | `npm run dev` | Start backend in development |
| Server | `npm start` | Start backend |
| Server | `npm test` | Run backend tests |
| Server | `npm run migrate:latest` | Apply database migrations |
| Client | `npm run dev` | Start student web app |
| Client | `npm run build` | Build student web app |
| Admin | `npm run dev` | Start admin dashboard |
| Admin | `npm run build` | Build admin dashboard |
| Mobile | `npm start` | Start Expo |

## Configuration notes

- Backend environment variables are documented in `server/.env.example`.
- Configure the frontend API URL using the client environment settings expected by the app.
- Use a managed database for deployed environments; local MySQL settings are for development only.
- Keep database credentials, JWT secrets, email credentials, and third-party API keys out of Git.
- Never use production credentials or real student data in local development or tests.

## Repository layout

```text
TradeLink/
├── admin/          # Admin web dashboard
├── client/         # Student web application
├── mobile/user/    # Student mobile application
├── server/         # Express API and Socket.IO server
└── DB/             # SQL schema and database documentation
```

## Contributing

1. Create a branch for your change.
2. Keep changes focused and follow the existing project structure.
3. Run the relevant tests or build before opening a pull request.
4. Never commit secrets, private keys, database dumps, or real student documents.

## License

This repository is intended for the TradeLink project and University of Cebu community. See the repository owner for usage and distribution permissions.
