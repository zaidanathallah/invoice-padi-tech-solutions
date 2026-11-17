const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'invoice_app',
    });

    console.log('Connected to MySQL successfully!');

    // Show tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    // Show cms_settings content if table exists
    const hasCmsTable = tables.some(row => Object.values(row).includes('cms_settings'));
    if (hasCmsTable) {
      const [rows] = await connection.query('SELECT * FROM cms_settings');
      console.log('Content of cms_settings:', rows);
    } else {
      console.log('cms_settings table does NOT exist!');
    }

    await connection.end();
  } catch (err) {
    console.error('Error running test script:', err);
  }
})();
