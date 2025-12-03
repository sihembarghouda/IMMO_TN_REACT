const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUsers.rows && existingUsers.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, hashedPassword]
    );

    const newUser = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role || 'buyer'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const users = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!users.rows || users.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        bio: user.bio,
        role: user.role || 'buyer'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, phone, photo, bio, role, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (!users.rows || users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get user
    const users = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.userId]
    );

    if (!users.rows || users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    // Delete user's properties
    await db.query('DELETE FROM properties WHERE user_id = $1', [req.userId]);
    
    // Delete user's favorites
    await db.query('DELETE FROM favorites WHERE user_id = $1', [req.userId]);
    
    // Delete user's messages
    await db.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [req.userId]);
    
    // Delete user's notifications
    await db.query('DELETE FROM notifications WHERE user_id = $1', [req.userId]);
    
    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [req.userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
