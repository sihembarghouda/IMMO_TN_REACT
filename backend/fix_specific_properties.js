const { Client } = require('pg');
require('dotenv').config();

async function fixSpecificProperties() {
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

    // Villa avec Jardin (ID: 18)
    const villaImages = [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop', // Villa moderne
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop', // Extérieur villa
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop', // Jardin
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop', // Villa luxe
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop'  // Piscine
    ];

    await client.query(
      'UPDATE properties SET images = $1, image = $2 WHERE id = 18',
      [JSON.stringify(villaImages), villaImages[0]]
    );
    console.log('✅ Updated Villa avec Jardin (ID: 18)');

    // Appartement S+2 à Sfax (ID: 15)
    const appartImages = [
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop', // Salon moderne
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // Appartement lumineux
      'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&h=600&fit=crop', // Cuisine
      'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&h=600&fit=crop', // Chambre
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&h=600&fit=crop'  // Salle à manger
    ];

    await client.query(
      'UPDATE properties SET images = $1, image = $2 WHERE id = 15',
      [JSON.stringify(appartImages), appartImages[0]]
    );
    console.log('✅ Updated Appartement S+2 à Sfax (ID: 15)');

    console.log('\n✅ Both properties updated with new working images');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixSpecificProperties();
