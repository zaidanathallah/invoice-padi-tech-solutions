import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'invoice_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

// Auto-run schema migrations on database connection
(async () => {
  try {
    const dbName = process.env.DB_NAME || 'invoice_app';
    
    // Check & Add created_by_user_id to companies
    const [compCols]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'created_by_user_id'
    `, [dbName]);
    
    if (compCols.length === 0) {
      try {
        await pool.query(`ALTER TABLE companies ADD COLUMN created_by_user_id VARCHAR(36) NULL`);
        console.log('Successfully added created_by_user_id column to companies table');
      } catch (err: any) {
        if (err.errno !== 1060) throw err;
      }
    }

    // Check & Add created_by_user_id to clients
    const [clientCols]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'created_by_user_id'
    `, [dbName]);
    
    if (clientCols.length === 0) {
      try {
        await pool.query(`ALTER TABLE clients ADD COLUMN created_by_user_id VARCHAR(36) NULL`);
        console.log('Successfully added created_by_user_id column to clients table');
      } catch (err: any) {
        if (err.errno !== 1060) throw err;
      }
    }
    // Check & Add registration_ip to users
    const [userIpCols]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'registration_ip'
    `, [dbName]);
    
    if (userIpCols.length === 0) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN registration_ip VARCHAR(45) NULL`);
        console.log('Successfully added registration_ip column to users table');
      } catch (err: any) {
        if (err.errno !== 1060) throw err;
      }
    }

    // Check & Add device_fingerprint to users
    const [userFpCols]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'device_fingerprint'
    `, [dbName]);
    
    if (userFpCols.length === 0) {
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN device_fingerprint VARCHAR(64) NULL`);
        console.log('Successfully added device_fingerprint column to users table');
      } catch (err: any) {
        if (err.errno !== 1060) throw err;
      }
    }

    // Create cms_settings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_settings (
        \`key\` VARCHAR(50) PRIMARY KEY,
        \`value\` TEXT NOT NULL
      )
    `);
    console.log('Successfully checked/created cms_settings table');
  } catch (err) {
    console.error('MySQL database migration error:', err);
  }
})();
