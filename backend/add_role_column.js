const { Client } = require('pg');
require('dotenv').config();

async function addRoleColumn() {
  const dbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'immo_tn',
    port: process.env.DB_PORT || 5432
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to database');

    // Add role column to users table
    await dbClient.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'buyer'
    `);
    console.log('✅ Role column added to users table');

    // Update existing users with default role
    await dbClient.query(`
      UPDATE users 
      SET role = 'buyer' 
      WHERE role IS NULL
    `);
    console.log('✅ Updated existing users with default role');

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await dbClient.end();
  }
}

addRoleColumn();
