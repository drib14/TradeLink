require('dotenv').config();
const mysql = require('mysql2/promise');

async function verify() {
  console.log('Connecting to configured database...');
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 20000,
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const [[users]] = await conn.query('SELECT COUNT(*) as count FROM users');
    const [[admins]] = await conn.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    console.log('\n--- User Account Counts (no personal data displayed) ---');
    console.log(`Total Users:        ${users.count}`);
    console.log(`Admin Accounts:     ${admins.count}`);

    const [[listings]] = await conn.query('SELECT COUNT(*) as count FROM listings');
    const [[transactions]] = await conn.query('SELECT COUNT(*) as count FROM transactions');
    const [[flash]] = await conn.query('SELECT COUNT(*) as count FROM flash_requests');
    const [[announcements]] = await conn.query('SELECT COUNT(*) as count FROM announcements');

    console.log('\n--- Live DB Table Counts ---');
    console.log(`Total Listings:     ${listings.count}`);
    console.log(`Total Transactions: ${transactions.count}`);
    console.log(`Total Flash Reqs:   ${flash.count}`);
    console.log(`Announcements:      ${announcements.count}`);

    await conn.end();
  } catch (err) {
    console.error('Error during verification:', err.message);
  }
}

verify();
