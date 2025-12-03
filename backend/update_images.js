const db = require('./src/config/database');

async function updateImages() {
  try {
    console.log('🖼️  Updating property images...');

    // Delete existing properties
    await db.query('DELETE FROM properties');
    console.log('🗑️  Cleared existing properties');

    // Properties with images
    const properties = [
      ['Appartement Moderne à Tunis', 'Magnifique appartement de 120m² avec vue sur la mer', 'APARTMENT', 'SALE', 350000, 'Tunis', 'Avenue Habib Bourguiba', 120, 3, 2, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 1],
      ['Villa avec Piscine à La Marsa', 'Villa luxueuse avec jardin et piscine', 'VILLA', 'SALE', 850000, 'Tunis', 'La Marsa', 300, 5, 3, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', 1],
      ['Studio à Sousse', 'Studio meublé proche de la plage', 'APARTMENT', 'RENT', 800, 'Sousse', 'Centre Ville', 45, 1, 1, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 1],
      ['Terrain Constructible', 'Terrain de 500m² zone résidentielle', 'LAND', 'SALE', 180000, 'Nabeul', 'Hammamet', 500, 0, 0, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', 2],
      ['Appartement S+2 à Sfax', 'Appartement spacieux bien situé', 'APARTMENT', 'RENT', 1200, 'Sfax', 'Centre Ville', 90, 2, 1, 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800', 2],
      ['Maison Traditionnelle', 'Belle maison avec patio', 'HOUSE', 'SALE', 420000, 'Kairouan', 'Médina', 180, 4, 2, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 2],
      ['Bureau Commercial', 'Espace de bureau moderne', 'OFFICE', 'RENT', 2500, 'Tunis', 'Les Berges du Lac', 150, 0, 2, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 3],
      ['Villa avec Jardin', 'Villa familiale spacieuse', 'VILLA', 'SALE', 650000, 'Sousse', 'Khezama', 250, 4, 3, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', 3],
      ['Appartement Vue Mer', 'Appartement de standing avec balcon', 'APARTMENT', 'SALE', 280000, 'Bizerte', 'Corniche', 100, 3, 2, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 3],
      ['Studio Étudiant', 'Studio meublé proche université', 'APARTMENT', 'RENT', 600, 'Monastir', 'Centre', 35, 1, 1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 4],
    ];

    for (const property of properties) {
      await db.query(
        `INSERT INTO properties 
        (title, description, type, transaction_type, price, city, address, surface, bedrooms, bathrooms, image, user_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        property
      );
      console.log(`✅ Added: ${property[0]}`);
    }

    console.log('\n🎉 Properties updated with images successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Update error:', error);
    process.exit(1);
  }
}

updateImages();
