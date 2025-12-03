const db = require('../config/database');

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const properties = await db.query(`
      SELECT p.*, u.name as owner_name, u.phone as owner_phone 
      FROM properties p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(properties.rows);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const properties = await db.query(`
      SELECT p.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email
      FROM properties p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.id = $1
    `, [req.params.id]);

    if (!properties.rows || properties.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(properties.rows[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new property
exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      transaction_type,
      price,
      city,
      address,
      surface,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      image
    } = req.body;

    // Convert empty strings to null for numeric fields
    const surfaceVal = surface && surface !== '' ? parseFloat(surface) : null;
    const bedroomsVal = bedrooms && bedrooms !== '' ? parseInt(bedrooms) : null;
    const bathroomsVal = bathrooms && bathrooms !== '' ? parseInt(bathrooms) : null;
    const priceVal = price && price !== '' ? parseFloat(price) : null;
    const latVal = latitude && latitude !== '' ? parseFloat(latitude) : null;
    const lngVal = longitude && longitude !== '' ? parseFloat(longitude) : null;

    const result = await db.query(
      `INSERT INTO properties 
      (user_id, title, description, type, transaction_type, price, city, address, surface, bedrooms, bathrooms, latitude, longitude, image) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.userId, title, description, type, transaction_type, priceVal, city, address, surfaceVal, bedroomsVal, bathroomsVal, latVal, lngVal, image]
    );

    res.status(201).json({
      message: 'Property created successfully',
      propertyId: result.rows[0].id
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const properties = await db.query('SELECT user_id FROM properties WHERE id = $1', [id]);
    
    if (!properties.rows || properties.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (properties.rows[0].user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const {
      title,
      description,
      type,
      transaction_type,
      price,
      city,
      address,
      surface,
      bedrooms,
      bathrooms,
      latitude,
      longitude,
      image
    } = req.body;

    // Convert empty strings to null for numeric fields
    const surfaceVal = surface && surface !== '' ? parseFloat(surface) : null;
    const bedroomsVal = bedrooms && bedrooms !== '' ? parseInt(bedrooms) : null;
    const bathroomsVal = bathrooms && bathrooms !== '' ? parseInt(bathrooms) : null;
    const priceVal = price && price !== '' ? parseFloat(price) : null;
    const latVal = latitude && latitude !== '' ? parseFloat(latitude) : null;
    const lngVal = longitude && longitude !== '' ? parseFloat(longitude) : null;

    await db.query(
      `UPDATE properties SET 
      title = $1, description = $2, type = $3, transaction_type = $4, price = $5, 
      city = $6, address = $7, surface = $8, bedrooms = $9, bathrooms = $10, 
      latitude = $11, longitude = $12, image = $13
      WHERE id = $14`,
      [title, description, type, transaction_type, priceVal, city, address, surfaceVal, bedroomsVal, bathroomsVal, latVal, lngVal, image, id]
    );

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete property
exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Delete request for property:', id, 'by user:', req.userId);
    
    // Check ownership
    const properties = await db.query('SELECT user_id FROM properties WHERE id = $1', [id]);
    
    if (!properties.rows || properties.rows.length === 0) {
      console.log('Property not found:', id);
      return res.status(404).json({ message: 'Property not found' });
    }

    if (properties.rows[0].user_id !== req.userId) {
      console.log('Unauthorized delete attempt. Property owner:', properties.rows[0].user_id, 'User:', req.userId);
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete related favorites first
    await db.query('DELETE FROM favorites WHERE property_id = $1', [id]);
    
    // Delete the property
    await db.query('DELETE FROM properties WHERE id = $1', [id]);
    
    console.log('Property deleted successfully:', id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's properties
exports.getUserProperties = async (req, res) => {
  try {
    const properties = await db.query(
      'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(properties.rows);
  } catch (error) {
    console.error('Get user properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
