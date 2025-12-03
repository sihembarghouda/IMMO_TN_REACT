const { Client } = require('pg');
require('dotenv').config();

async function updateImagesUrls() {
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

    const properties = await client.query('SELECT id, type FROM properties');
    
    // Vraies photos d'appartements et maisons depuis Unsplash
    const realEstateImages = {
      apartment: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', // Appartement moderne
        'https://images.unsplash.com/photo-1502672260066-6bc35f0b8f89?w=800&h=600&fit=crop', // Salon luxueux
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // Appartement lumineux
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop', // Cuisine moderne
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Chambre élégante
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop', // Salle à manger
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop', // Cuisine design
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=600&fit=crop', // Chambre moderne
      ],
      house: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop', // Maison moderne
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop', // Belle maison
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop', // Maison luxueuse
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop', // Façade maison
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', // Villa moderne
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop', // Maison avec jardin
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&h=600&fit=crop', // Belle villa
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&h=600&fit=crop', // Maison de rêve
      ],
      villa: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop', // Villa luxe
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=600&fit=crop', // Villa piscine
        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop', // Grande villa
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop', // Villa moderne
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop', // Villa jardin
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop', // Villa extérieur
      ],
      office: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', // Bureau moderne
        'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', // Open space
        'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&h=600&fit=crop', // Bureau design
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop', // Espace bureau
      ]
    };
    
    for (const property of properties.rows) {
      const images = [];
      const imageCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 images
      
      // Sélectionner les images selon le type de propriété
      let imagePool = realEstateImages.apartment;
      if (property.type && property.type.toLowerCase().includes('villa')) {
        imagePool = realEstateImages.villa;
      } else if (property.type && (property.type.toLowerCase().includes('maison') || property.type.toLowerCase().includes('house'))) {
        imagePool = realEstateImages.house;
      } else if (property.type && (property.type.toLowerCase().includes('bureau') || property.type.toLowerCase().includes('office'))) {
        imagePool = realEstateImages.office;
      }
      
      // Sélectionner des images aléatoires depuis le pool approprié
      for (let i = 0; i < imageCount; i++) {
        const randomIndex = Math.floor(Math.random() * imagePool.length);
        images.push(imagePool[randomIndex]);
      }
      
      await client.query(
        'UPDATE properties SET images = $1 WHERE id = $2',
        [JSON.stringify(images), property.id]
      );
      
      console.log(`✅ Updated property ${property.id} (${property.type}) with ${imageCount} images`);
    }

    console.log('\n✅ All properties updated with new image URLs');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updateImagesUrls();
