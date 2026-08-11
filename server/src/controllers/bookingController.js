const bookingRepo = require('../repositories/bookingRepo');
const userRepo = require('../repositories/userRepo');
const itineraryRepo = require('../repositories/itineraryRepo');

async function getAuthorizedBooking(req, res, bookingId, { allowAdmin = true } = {}) {
    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return null;
    }

    const isTourist = req.user.role === 'tourist' && Number(booking.tourist_id) === req.user.id;
    const isGuide = req.user.role === 'guide' && Number(booking.guide_id) === req.user.id;
    const isAdmin = allowAdmin && req.user.role === 'admin';
    if (!isTourist && !isGuide && !isAdmin) {
        res.status(403).json({ error: 'You do not have access to this booking' });
        return null;
    }
    return booking;
}

async function getOwnedItinerary(req, res, itineraryId) {
    const itinerary = await itineraryRepo.getItineraryById(itineraryId);
    if (!itinerary) {
        res.status(404).json({ error: 'Itinerary not found' });
        return null;
    }
    if (Number(itinerary.tourist_id) !== req.user.id) {
        res.status(403).json({ error: 'You can only book guides for your own itinerary' });
        return null;
    }
    return itinerary;
}

async function requestGuidesForItinerary(req, res) {
    try {
        const { itineraryId } = req.params;
        const { notes } = req.body;

        const itinerary = await getOwnedItinerary(req, res, itineraryId);
        if (!itinerary) return;

        const locationNames = [...new Set(itinerary.places.map(p => p.name))];

        const potentialGuides = await userRepo.findGuidesByLocations(locationNames);

        if (potentialGuides.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No guides found for these locations' 
            });
        }

        const createdBookings = [];
        for (const guide of potentialGuides) {
            const booking = await bookingRepo.createBooking(itineraryId, guide.user_id, req.user.id, notes);
            createdBookings.push(booking);
        }

        res.status(201).json({ 
            success: true, 
            message: `Requests sent to ${potentialGuides.length} potential guides`,
            bookings: createdBookings 
        });
    } catch (error) {
        console.error('Request guides error:', error);
        res.status(500).json({ error: 'Failed to request guides' });
    }
}

async function createBooking(req, res) {
    try {
        const { itineraryId, guideId, notes } = req.body;
        
        if (!itineraryId || !guideId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!await getOwnedItinerary(req, res, itineraryId)) return;

        const booking = await bookingRepo.createBooking(itineraryId, guideId, req.user.id, notes);
        res.status(201).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
}

async function getGuideBookings(req, res) {
    try {
        const { guideId } = req.params;
        const bookings = await bookingRepo.getGuideBookings(guideId);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

async function getTouristBookings(req, res) {
    try {
        const { touristId } = req.params;
        const bookings = await bookingRepo.getTouristBookings(touristId);
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
}

async function quotePrice(req, res) {
    try {
        const { id } = req.params;
        const { price, currency } = req.body;

        const existingBooking = await getAuthorizedBooking(req, res, id);
        if (!existingBooking) return;
        if (existingBooking.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending bookings can be quoted' });
        }

        if (!price) {
            return res.status(400).json({ error: 'Price is required' });
        }

        const booking = await bookingRepo.updateBookingStatus(id, 'quoted', price, currency || 'LKR');
        res.status(200).json({ success: true, booking });
    } catch (error) {
        console.error('Error quoting price:', error);
        res.status(500).json({ error: 'Failed to quote price' });
    }
}

async function acceptQuote(req, res) {
    try {
        const { id } = req.params;
        const existingBooking = await getAuthorizedBooking(req, res, id);
        if (!existingBooking) return;
        if (existingBooking.status !== 'quoted') {
            return res.status(400).json({ error: 'Only quoted bookings can be accepted' });
        }
        const booking = await bookingRepo.updateBookingStatus(id, 'accepted');
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to accept quote' });
    }
}

async function rejectQuote(req, res) {
    try {
        const { id } = req.params;
        const existingBooking = await getAuthorizedBooking(req, res, id);
        if (!existingBooking) return;
        const allowedStatus = req.user.role === 'guide' ? 'pending' : 'quoted';
        if (existingBooking.status !== allowedStatus) {
            return res.status(400).json({ error: `Only ${allowedStatus} bookings can be rejected by this user` });
        }
        const booking = await bookingRepo.updateBookingStatus(id, 'rejected');
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject quote' });
    }
}

async function getBookingMessages(req, res) {
    try {
        const { id } = req.params;
        if (!await getAuthorizedBooking(req, res, id, { allowAdmin: false })) return;
        const messages = await bookingRepo.getBookingMessages(id);
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Fetch booking messages error:', error);
        res.status(500).json({ error: 'Failed to fetch booking messages' });
    }
}

async function sendBookingMessage(req, res) {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!await getAuthorizedBooking(req, res, id, { allowAdmin: false })) return;

        const savedMessage = await bookingRepo.createBookingMessage(id, req.user.id, message.trim());
        res.status(201).json({ success: true, message: savedMessage });
    } catch (error) {
        console.error('Send booking message error:', error);
        res.status(500).json({ error: 'Failed to send booking message' });
    }
}

async function cancelBooking(req, res) {
    try {
        const { id } = req.params;
        const booking = await getAuthorizedBooking(req, res, id);
        if (!booking) return;

        if (!['pending', 'quoted'].includes(booking.status)) {
            return res.status(400).json({ error: 'Cannot cancel this booking at this stage' });
        }

        const updatedBooking = await bookingRepo.updateBookingStatus(id, 'cancelled');
        res.status(200).json({ success: true, booking: updatedBooking });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
}

async function deleteBooking(req, res) {
    try {
        const { id } = req.params;
        const booking = await getAuthorizedBooking(req, res, id);
        if (!booking) return;
        if (!['cancelled', 'rejected'].includes(booking.status)) {
            return res.status(400).json({ error: 'Only cancelled or rejected bookings can be deleted' });
        }

        await bookingRepo.deleteBooking(id);
        res.status(200).json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
}

async function getNotificationCount(req, res) {
    try {
        const { guideId } = req.params;
        const count = await bookingRepo.getPendingGuideNotificationsCount(guideId);
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification count' });
    }
}

module.exports = {
    requestGuidesForItinerary,
    createBooking,
    getGuideBookings,
    getTouristBookings,
    quotePrice,
    acceptQuote,
    rejectQuote,
    getBookingMessages,
    sendBookingMessage,
    cancelBooking,
    deleteBooking,
    getNotificationCount
};
