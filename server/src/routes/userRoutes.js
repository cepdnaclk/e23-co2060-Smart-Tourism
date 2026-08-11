const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const itineraryController = require('../controllers/itineraryController');
const { authenticate, requireRole, requireSelf } = require('../middleware/auth');

router.use(authenticate);

/**
 * USER ROUTES
 * Routes for user profile management
 */

// Get user profile
router.get('/:id/profile', requireSelf('id'), userController.getUserProfile);

// Update tourist profile
router.post('/:id/profile', requireRole('tourist', 'admin'), requireSelf('id'), userController.updateTouristProfile);

// Update guide profile
router.post('/:id/guide-profile', requireRole('guide', 'admin'), requireSelf('id'), userController.updateGuideProfile);

// Delete user account permanently
router.delete('/:id/account', requireSelf('id'), userController.deleteAccount);

// Get all itineraries for a tourist
router.get('/:tourist_id/itineraries', requireRole('tourist', 'admin'), requireSelf('tourist_id'), itineraryController.getTouristItineraries);

// Get dashboard stats for a user
router.get('/:id/stats', requireSelf('id'), userController.getUserStats);

// Change user password
router.post('/:id/change-password', requireSelf('id', { allowAdmin: false }), userController.changePassword);

module.exports = router;
