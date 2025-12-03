const { Client } = require('pg');
require('dotenv').config();

async function testImages() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'immo_tn',
    port: process.env.DB_PORT || 5432
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const result = await client.query('SELECT id, title, images FROM properties LIMIT 3');
    
    console.log('\n=== Testing Images Data ===\n');
    result.rows.forEach(row => {
      console.log(`Property ${row.id}: ${row.title}`);
      console.log('Images type:', typeof row.images);
      console.log('Images value:', row.images);
      console.log('Is Array:', Array.isArray(row.images));
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testImages();
