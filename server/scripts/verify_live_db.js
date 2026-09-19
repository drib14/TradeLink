require('dotenv').config();
const mysql = require('mysql2/promise');

async function verify() {
  console.log('Connecting to', process.env.DB_HOST, 'on port', process.env.DB_PORT, '...');
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

    const [users] = await conn.query('SELECT id, name, email, student_id, role, campus FROM users');
    console.log('\n--- Active Users in Live DB ---');
    console.table(users);

    const [[listings]] = await conn.query('SELECT COUNT(*) as count FROM listings');
    const [[transactions]] = await conn.query('SELECT COUNT(*) as count FROM transactions');
    const [[flash]] = await conn.query('SELECT COUNT(*) as count FROM flash_requests');
    const [[announcements]] = await conn.query('SELECT COUNT(*) as count FROM announcements');

    console.log('\n--- Live DB Table Counts ---');
    console.log(`Total Users:        ${users.length}`);
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
