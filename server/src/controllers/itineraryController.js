const itineraryRepo = require('../repositories/itineraryRepo');

async function getOwnedItinerary(req, res, itineraryId) {
    const itinerary = await itineraryRepo.getItineraryById(itineraryId);
    if (!itinerary) {
        res.status(404).json({ error: 'Itinerary not found' });
        return null;
    }
    if (Number(itinerary.tourist_id) !== req.user.id) {
        res.status(403).json({ error: 'You can only access your own itineraries' });
        return null;
    }
    return itinerary;
}

/**
 * ITINERARIES CONTROLLER
 * Handles travel itinerary operations
 */

/**
 * POST /api/itineraries
 * Create a new itinerary
 */
async function createItinerary(req, res) {
    try {
        const { title, start_date, end_date, places } = req.body;

        if (!title) {
            return res.status(400).json({ 
                error: 'title is required'
            });
        }

        const itinerary = await itineraryRepo.createItinerary(
            req.user.id,
            title,
            start_date,
            end_date,
            places
        );

        res.status(201).json({
            success: true,
            message: 'Itinerary created successfully',
            itinerary
        });
    } catch (error) {
        console.error('Error creating itinerary:', error);
        res.status(500).json({ error: 'Failed to create itinerary' });
    }
}

/**
 * GET /api/itineraries/:id
 * Fetch a single itinerary with all places
 */
async function getItinerary(req, res) {
    try {
        const { id } = req.params;

        const itinerary = await getOwnedItinerary(req, res, id);
        if (!itinerary) return;

        res.status(200).json({
            success: true,
            data: itinerary
        });
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
}

/**
 * GET /api/users/:tourist_id/itineraries
 * Get all itineraries for a tourist
 */
async function getTouristItineraries(req, res) {
    try {
        const { tourist_id } = req.params;

        const itineraries = await itineraryRepo.getTouristItineraries(tourist_id);

        res.status(200).json({
            success: true,
            data: itineraries,
            count: itineraries.length
        });
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
}

/**
 * PUT /api/itineraries/:id
 * Update an itinerary
 */
async function updateItinerary(req, res) {
    try {
        const { id } = req.params;
        const { title, start_date, end_date } = req.body;

        if (!await getOwnedItinerary(req, res, id)) return;

        const itinerary = await itineraryRepo.updateItinerary(
            id,
            title,
            start_date,
            end_date
        );

        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Itinerary updated successfully',
            itinerary
        });
    } catch (error) {
        console.error('Error updating itinerary:', error);
        res.status(500).json({ error: 'Failed to update itinerary' });
    }
}

/**
 * DELETE /api/itineraries/:id
 * Delete an itinerary
 */
async function deleteItinerary(req, res) {
    try {
        const { id } = req.params;

        if (!await getOwnedItinerary(req, res, id)) return;

        await itineraryRepo.deleteItinerary(id);

        res.status(200).json({
            success: true,
            message: 'Itinerary deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
}

/**
 * POST /api/itineraries/:itinerary_id/places
 * Add a place to an itinerary
 */
async function addPlaceToItinerary(req, res) {
    try {
        const { itinerary_id } = req.params;
        const { place_id, visit_order, notes } = req.body;

        if (!await getOwnedItinerary(req, res, itinerary_id)) return;

        if (!place_id) {
            return res.status(400).json({ error: 'place_id is required' });
        }

        const item = await itineraryRepo.addPlaceToItinerary(
            parseInt(itinerary_id),
            parseInt(place_id),
            visit_order || 1,
            notes
        );

        const statusCode = item.already_exists ? 200 : 201;
        const message = item.already_exists ? 'Place already exists in itinerary' : 'Place added to itinerary';

        res.status(statusCode).json({
            success: true,
            message,
            item
        });
    } catch (error) {
        console.error('Error adding place to itinerary:', error);
        res.status(500).json({ error: error.message || 'Failed to add place to itinerary' });
    }
}

/**
 * DELETE /api/itineraries/:itinerary_id/places/:place_id
 * Remove a place from an itinerary
 */
async function removePlaceFromItinerary(req, res) {
    try {
        const { itinerary_id, place_id } = req.params;

        if (!await getOwnedItinerary(req, res, itinerary_id)) return;

        await itineraryRepo.removePlaceFromItinerary(itinerary_id, place_id);

        res.status(200).json({
            success: true,
            message: 'Place removed from itinerary'
        });
    } catch (error) {
        console.error('Error removing place from itinerary:', error);
        res.status(500).json({ error: 'Failed to remove place from itinerary' });
    }
}

module.exports = {
    createItinerary,
    getItinerary,
    getTouristItineraries,
    updateItinerary,
    deleteItinerary,
    addPlaceToItinerary,
    removePlaceFromItinerary
};
