const userRepo = require('../repositories/userRepo');
const itineraryRepo = require('../repositories/itineraryRepo');

/**
 * GUIDE CONTROLLER
 * Handles travel guide related public operations
 */

/**
 * GET /api/guides
 * Fetch all verified/active travel guides
 */
async function getAllGuides(req, res) {
    try {
        const guides = await userRepo.getAllGuides();
        
        res.status(200).json({
            success: true,
            guides
        });
    } catch (error) {
        console.error('Error fetching guides:', error);
        res.status(500).json({ error: 'Failed to fetch travel guides' });
    }
}

/**
 * GET /api/guides/:id
 * Fetch a specific guide's portfolio
 */
async function getGuideById(req, res) {
    try {
        const { id } = req.params;
        const user = await userRepo.getUserById(id);
        if (!user || user.role !== 'guide') {
            return res.status(404).json({ error: 'Guide not found' });
        }
        const guide = await userRepo.getUserProfile(id);
        
        if (!guide) {
            return res.status(404).json({ error: 'Guide not found' });
        }
        
        res.status(200).json({
            success: true,
            guide
        });
    } catch (error) {
        console.error('Error fetching guide:', error);
        res.status(500).json({ error: 'Failed to fetch guide details' });
    }
}

/**
 * GET /api/guides/suggest/:itineraryId
 * Suggest suitable guides based on itinerary places
 */
async function suggestGuidesForItinerary(req, res) {
    try {
        const { itineraryId } = req.params;
        
        if (!itineraryId) {
            return res.status(400).json({ error: 'itineraryId is required' });
        }

        const itinerary = await itineraryRepo.getItineraryById(itineraryId);
        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }
        if (Number(itinerary.tourist_id) !== req.user.id) {
            return res.status(403).json({ error: 'You can only request suggestions for your own itinerary' });
        }

        const suggestedGuides = await userRepo.suggestGuidesForItinerary(itineraryId);
        
        res.status(200).json({
            success: true,
            message: `Found ${suggestedGuides.length} suitable guides for this itinerary`,
            guides: suggestedGuides
        });
    } catch (error) {
        console.error('Error suggesting guides:', error);
        res.status(500).json({ error: 'Failed to suggest guides for itinerary' });
    }
}

async function getGuideReviews(req, res) {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid guide ID' });
        }

        const reviews = await userRepo.getGuideReviews(parseInt(id));
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching guide reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
}

async function createGuideReview(req, res) {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid guide ID' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
        }

        const review = await userRepo.createGuideReview(
            parseInt(id),
            req.user.id,
            parseInt(rating),
            comment || ''
        );

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error('Error creating guide review:', error);
        res.status(500).json({ success: false, error: 'Failed to submit review' });
    }
}

async function deleteGuideReview(req, res) {
    try {
        const reviewId = parseInt(req.params.reviewId);
        const existingReview = await userRepo.getGuideReviewById(reviewId);
        if (!existingReview) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        if (Number(existingReview.tourist_id) !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You can only delete your own reviews' });
        }

        const result = await userRepo.deleteGuideReview(reviewId);
        if (!result) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }
        res.status(200).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting guide review:', error);
        res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
}

module.exports = {
    getAllGuides,
    getGuideById,
    suggestGuidesForItinerary,
    getGuideReviews,
    createGuideReview,
    deleteGuideReview
};
