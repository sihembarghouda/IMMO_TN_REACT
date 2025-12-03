const { Client } = require('pg');
require('dotenv').config();

async function checkSpecificProperties() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'immo_tn',
    port: process.env.DB_PORT || 5432
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Chercher les propriétés mentionnées
    const result = await client.query(`
      SELECT id, title, type, city, image, images 
      FROM properties 
      WHERE LOWER(title) LIKE '%villa%jardin%' 
         OR LOWER(title) LIKE '%appartement%s+2%sfax%'
         OR LOWER(title) LIKE '%s+2%'
         OR LOWER(city) LIKE '%sfax%'
    `);
    
    console.log(`Found ${result.rows.length} matching properties:\n`);
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Title: ${row.title}`);
      console.log(`Type: ${row.type}`);
      console.log(`City: ${row.city}`);
      console.log(`Main image: ${row.image}`);
      console.log(`Images array:`, row.images);
      console.log(`Images count: ${row.images ? row.images.length : 0}`);
      console.log('---\n');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSpecificProperties();
