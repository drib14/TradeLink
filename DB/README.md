# TradeLink Database (MySQL 8.0)

This folder contains the complete SQL scripts and database documentation for the **TradeLink** University of Cebu student marketplace.

---

## 📁 Files

- `schema.sql` — Complete Data Definition Language (DDL) creating all 22 relational tables, strict foreign key constraints, composite unique indexes, check constraints, and fulltext search indexes.
- `seed.sql` — Initial University of Cebu seed data configuring the official Admin account, announcements, prohibited keywords, and system configuration.

---

## 🚀 Quick Setup Instructions

### Option 1: Using MySQL CLI
```bash
# Log in to your MySQL server
mysql -u root -p

# Create and populate database
source c:/Users/jhond/Documents/TradeLink/DB/schema.sql;
source c:/Users/jhond/Documents/TradeLink/DB/seed.sql;
```

### Option 2: Using XAMPP / phpMyAdmin / MySQL Workbench
1. Open MySQL Workbench or phpMyAdmin (`http://localhost/phpmyadmin`).
2. Create a new database named `tradelink_db_test` with collation `utf8mb4_unicode_ci` (or execute `schema.sql` which creates it automatically).
3. Open `schema.sql` and execute the script.
4. Open `seed.sql` and execute the script.

### Option 3: Automated via Knex Migrations (Node.js Backend)
Inside the `server/` directory:
```bash
cd server
npm install
npx knex migrate:latest
npx knex seed:run
```

---

## 👥 Default Seeded Account

| Role | ID Number | Email | Password | Campus | Notes |
|---|---|---|---|---|---|
| **Admin** | `ADMIN001` | `uc.tradelink@gmail.com` | `TradeLink@2026` | UC Main | Official campus moderation & safety administration desk |

*Note: Clean seed contains ONLY this administrator. Real students register and verify their accounts through the onboarding and eKYC verification flows.*
