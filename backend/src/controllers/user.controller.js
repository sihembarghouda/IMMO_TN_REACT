const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const users = await db.query(
      'SELECT id, name, email, phone, photo, bio, created_at FROM users WHERE id = $1',
      [id]
    );

    if (!users.rows || users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, photo, role } = req.body;

    // Récupérer l'ancien rôle
    const oldUserData = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [req.userId]
    );
    const oldRole = oldUserData.rows[0]?.role;

    await db.query(
      'UPDATE users SET name = $1, phone = $2, bio = $3, photo = $4, role = $5 WHERE id = $6',
      [name, phone, bio, photo, role || 'buyer', req.userId]
    );

    // Si le rôle a changé, créer une notification
    if (role && role !== oldRole) {
      const roleNames = {
        buyer: 'Acheteur',
        seller: 'Vendeur',
        visitor: 'Visiteur'
      };

      await db.query(
        'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
        [
          req.userId,
          'role_change',
          'Changement de rôle',
          `Votre rôle a été changé en ${roleNames[role] || role}. Vous avez maintenant accès à de nouvelles fonctionnalités !`
        ]
      );
    }

    const users = await db.query(
      'SELECT id, name, email, phone, photo, bio, role FROM users WHERE id = $1',
      [req.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: users.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
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

    // Get current password
    const users = await db.query('SELECT password FROM users WHERE id = $1', [req.userId]);

    if (!users.rows || users.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, users.rows[0].password);

    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
