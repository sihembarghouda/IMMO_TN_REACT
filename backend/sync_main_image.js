const { Client } = require('pg');
require('dotenv').config();

async function syncMainImage() {
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

    const properties = await client.query('SELECT id, images FROM properties WHERE images IS NOT NULL');
    
    for (const property of properties.rows) {
      if (property.images && property.images.length > 0) {
        // Mettre à jour la colonne image avec la première image du tableau
        await client.query(
          'UPDATE properties SET image = $1 WHERE id = $2',
          [property.images[0], property.id]
        );
        console.log(`✅ Updated main image for property ${property.id}`);
      }
    }

    console.log('\n✅ All main images synchronized');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

syncMainImage();
