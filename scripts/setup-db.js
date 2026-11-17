const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('Connecting to local MySQL at 127.0.0.1:3306 (user: root)...');

  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      multipleStatements: true,
    });

    console.log('Connected to MySQL successfully!');

    const sqlPath = path.join(__dirname, '..', 'schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema.sql DDL & Seed statements...');
    await connection.query(sqlContent);

    // Ensure logo column exists in companies table
    try {
      await connection.query(`ALTER TABLE companies ADD COLUMN logo LONGTEXT NULL`);
    } catch (e) {
      // Column already exists, ignore
    }

    console.log('Database `invoice_app` and all tables created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Failed to setup database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
