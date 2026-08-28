# TradeLink Database (MySQL 8.0)

This folder contains the complete SQL scripts and database documentation for the **TradeLink** University of Cebu student marketplace.

---

## 📁 Files

- `schema.sql` — Complete Data Definition Language (DDL) creating all 22 relational tables, strict foreign key constraints, composite unique indexes, check constraints, and fulltext search indexes.
- `seed.sql` — Initial University of Cebu seed data including SuperAdmin, Admin, verified student accounts across UC Main, UC Banilad, UC LM, UC METC, sample listings, meetup transactions with 4-digit handshake codes, swap proposals, reviews with badges, and system configs.

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
2. Create a new database named `tradelink_db` with collation `utf8mb4_unicode_ci`.
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

## 👥 Default Test Accounts

| Role | Email | Password | Campus | Notes |
|---|---|---|---|---|
| **SuperAdmin** | `superadmin@uc.edu.ph` | `superadmin123` | UC Main | Full administrative privileges & platform config |
| **Admin** | `admin@uc.edu.ph` | `admin123` | UC Main | Moderation desk, dispute verdicts, verification reviews |
| **Student** | `maria.nursing@uc.edu.ph` | `password123` | UC Banilad | Verified student, Pro Merchant badge |
| **Student** | `ken.engg@uc.edu.ph` | `password123` | UC LM | Verified student (Engineering) |
| **Student** | `alex.stem@uc.edu.ph` | `password123` | UC Main | Verified student (Senior High STEM) |
| **Student** | `beatrice.maritime@uc.edu.ph`| `password123` | UC METC | Verified student (Maritime) |
| **Student** | `dave.ccs@uc.edu.ph` | `password123` | UC Main | Verified student (CCS) |
| **Student** | `chloe.cba@uc.edu.ph` | `password123` | UC South Campus | Unverified student (Pending ID review) |
