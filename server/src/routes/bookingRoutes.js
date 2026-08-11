const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, requireRole, requireSelf } = require('../middleware/auth');

router.use(authenticate);

// All booking routes
router.post('/itinerary/:itineraryId/request', requireRole('tourist'), bookingController.requestGuidesForItinerary);
router.post('/', requireRole('tourist'), bookingController.createBooking);
router.get('/guide/:guideId', requireRole('guide', 'admin'), requireSelf('guideId'), bookingController.getGuideBookings);
router.get('/tourist/:touristId', requireRole('tourist', 'admin'), requireSelf('touristId'), bookingController.getTouristBookings);
router.get('/:id/messages', bookingController.getBookingMessages);
router.post('/:id/messages', bookingController.sendBookingMessage);
router.put('/:id/quote', requireRole('guide'), bookingController.quotePrice);
router.put('/:id/accept', requireRole('tourist'), bookingController.acceptQuote);
router.put('/:id/reject', requireRole('tourist', 'guide'), bookingController.rejectQuote);
router.put('/:id/cancel', requireRole('tourist'), bookingController.cancelBooking);
router.delete('/:id', requireRole('tourist'), bookingController.deleteBooking);
router.get('/guide/:guideId/notifications', requireRole('guide', 'admin'), requireSelf('guideId'), bookingController.getNotificationCount);

module.exports = router;
