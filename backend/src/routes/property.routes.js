const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/', propertyController.getAllProperties);

// Protected routes (specific routes before parameterized routes)
router.get('/user/my-properties', authMiddleware, propertyController.getUserProperties);
router.post('/', authMiddleware, propertyController.createProperty);
router.get('/:id', propertyController.getPropertyById);
router.put('/:id', authMiddleware, propertyController.updateProperty);
router.delete('/:id', authMiddleware, propertyController.deleteProperty);

module.exports = router;
