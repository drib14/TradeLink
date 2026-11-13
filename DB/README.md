# TradeLink Database (MySQL 8.0)

TradeLink uses MySQL 8.0 with Knex migrations. The schema contains relational
foreign keys and indexes, but **MySQL 8.0 does not provide native row-level
security (RLS) policies** like PostgreSQL. Access isolation is therefore
implemented by authenticated API routes and ownership checks in backend
controllers. See [Database security](../docs/DATABASE_SECURITY.md).

## Files

- `schema.sql` — MySQL DDL for the application tables. Review the destructive
  DROP statements before using it; never run it against a database containing
  production data.
- `seed.sql` — Retired. It intentionally contains no executable SQL because
  the previous version included a known default administrator password and
  real student personal data.
- `../server/migrations/` — Versioned Knex migrations (preferred for setup).
- `../server/seeds/` — Optional destructive Knex seed, protected by an
  explicit environment confirmation.

## Local setup

1. Start a local MySQL 8.0 service.
2. Copy `server/.env.example` to `server/.env`.
3. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and
   `DB_NAME` for a disposable local database.
4. Set `ADMIN_SEED_EMAIL` and a unique `ADMIN_SEED_PASSWORD` (at least
   16 characters) in `server/.env`.
5. From the repository root, install dependencies and run:

```bash
npm install --prefix server
npm run migrate:latest --prefix server
npm run dev:server
```

The backend initializes a first administrator only when both administrator
environment values are configured. It does not reset an existing admin
password on every boot. To intentionally sync a password from the environment,
set `SYNC_ADMIN_SEED_PASSWORD=true` for that deployment.

## Destructive seed warning

The Knex seed truncates user and marketplace tables. It refuses to run unless
`ALLOW_DESTRUCTIVE_SEED=true` is explicitly set. Never run it against
production or a database containing real student records.

The separate `server/scripts/clean_seed_live_db.js` script requires explicit
destructive confirmation and a second confirmation for production. Avoid
running it unless you have verified the database host and name and have a
restorable backup.

## Privacy and credentials

- Never commit `.env` files, API keys, passwords, private keys, database
  dumps, student ID numbers, or ID/selfie images.
- Keep Cloudinary, SMTP, JWT, database, and AI provider credentials in
  `server/.env` or the hosting provider's server-side environment settings.
- Never prefix a secret with `VITE_` or `EXPO_PUBLIC_`; those values are
  compiled into browser/mobile application bundles.
- Do not seed real student identities or real ID documents into source control.
