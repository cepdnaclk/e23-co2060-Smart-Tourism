const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * TRAVEL GUIDE ROUTES
 * Public routes to browse and view travel guides
 */

// Get all guides
router.get('/', guideController.getAllGuides);

// Suggest guides for itinerary
router.get('/suggest/:itineraryId', authenticate, requireRole('tourist'), guideController.suggestGuidesForItinerary);

// Get guide by ID
router.get('/:id', guideController.getGuideById);

// Guide Reviews
router.get('/:id/reviews', guideController.getGuideReviews);
router.post('/:id/reviews', authenticate, requireRole('tourist'), guideController.createGuideReview);
router.delete('/:id/reviews/:reviewId', authenticate, requireRole('tourist'), guideController.deleteGuideReview);

module.exports = router;
