const { Client } = require('pg');
require('dotenv').config();

async function addImagesColumn() {
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

    // Add images column (JSONB array)
    await client.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
    `);
    console.log('✅ Images column added');

    // Update existing properties with multiple images
    const properties = await client.query('SELECT id, image FROM properties');
    
    for (const property of properties.rows) {
      const images = [];
      const baseId = 1000 + property.id;
      
      // Add 3-5 images per property
      const imageCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 images
      
      for (let i = 0; i < imageCount; i++) {
        images.push(`https://source.unsplash.com/800x600/?house,interior,${baseId + i}`);
      }
      
      await client.query(
        'UPDATE properties SET images = $1 WHERE id = $2',
        [JSON.stringify(images), property.id]
      );
      
      console.log(`✅ Updated property ${property.id} with ${imageCount} images`);
    }

    console.log('✅ All properties updated with multiple images');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addImagesColumn();
