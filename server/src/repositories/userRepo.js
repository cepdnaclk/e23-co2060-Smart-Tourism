const db = require('../config/db');

// Check if an email is already in the database
const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await db.query(query, [email]);
    return result.rows[0];
};

// Insert a new user into the database
const createUser = async (email, passwordHash, role) => {
    const query = `
        INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, created_at;
    `;
    // If no role is provided, default to 'tourist'
    const values = [email, passwordHash, role || 'tourist'];
    const result = await db.query(query, values);
    return result.rows[0]; // Returns the newly created user (without the password!)
};

// Get user by ID
const getUserById = async (userId) => {
    const query = `SELECT id, email, role, is_verified, created_at FROM users WHERE id = $1`;
    const result = await db.query(query, [userId]);
    return result.rows[0];
};

// Get user profile (tourist or guide)
const getUserProfile = async (userId) => {
    try {
        const userRole = await db.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (!userRole.rows[0]) {
            return null;
        }

        const role = userRole.rows[0].role;

        if (role === 'guide') {
            const result = await db.query(
                'SELECT * FROM guide_profiles WHERE user_id = $1',
                [userId]
            );
            return result.rows[0];
        } else {
            const result = await db.query(
                'SELECT * FROM tourist_profiles WHERE user_id = $1',
                [userId]
            );
            return result.rows[0];
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

// Update or create tourist profile
const updateTouristProfile = async (userId, fullName, nationality, contactNumber) => {
    try {
        const result = await db.query(
            `INSERT INTO tourist_profiles (user_id, full_name, nationality, contact_number)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET full_name = $2, nationality = $3, contact_number = $4
             RETURNING *`,
            [userId, fullName, nationality, contactNumber]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating tourist profile:', error);
        throw error;
    }
};

// Update or create guide profile
const updateGuideProfile = async (userId, fullName, bio, licenseNumber, hourlyRate, contactNumber, profileImageUrl, specialization, experienceYears, languages, coveredLocations) => {
    try {
        const result = await db.query(
            `INSERT INTO guide_profiles (user_id, full_name, bio, license_number, hourly_rate, contact_number, profile_image_url, specialization, experience_years, languages, covered_locations)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (user_id) DO UPDATE SET 
                full_name = $2, 
                bio = $3, 
                license_number = $4, 
                hourly_rate = $5,
                contact_number = $6,
                profile_image_url = $7,
                specialization = $8,
                experience_years = $9,
                languages = $10,
                covered_locations = $11
             RETURNING *`,
            [userId, fullName, bio, licenseNumber, hourlyRate, contactNumber, profileImageUrl, specialization, experienceYears, languages, coveredLocations]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error updating guide profile:', error);
        throw error;
    }
};

// Get all guides
const getAllGuides = async () => {
    try {
        const query = `
            SELECT gp.*, u.email 
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            WHERE u.role = 'guide'
        `;
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching all guides:', error);
        throw error;
    }
};

// Suggest guides based on itinerary places
const suggestGuidesForItinerary = async (itineraryId) => {
    try {
        const placesQuery = `
            SELECT p.name, p.category
            FROM itinerary_items ii
            JOIN places p ON ii.place_id = p.id
            WHERE ii.itinerary_id = $1
            ORDER BY ii.visit_order
        `;
        const placesResult = await db.query(placesQuery, [itineraryId]);
        const places = placesResult.rows;

        if (places.length === 0) {
            return [];
        }

        const placeNames = places.map(p => p.name.toLowerCase());
        const placeCategories = [...new Set(places.map(p => p.category))];

        const guidesQuery = `
            SELECT gp.*, u.email,
                   CASE WHEN gp.covered_locations IS NOT NULL THEN 1 ELSE 0 END as has_locations,
                   COALESCE(AVG(gr.rating), 0) AS average_rating,
                   COUNT(gr.id) AS review_count
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            LEFT JOIN guide_reviews gr ON gp.user_id = gr.guide_id
            WHERE u.role = 'guide'
            GROUP BY gp.id, u.id
        `;
        const guidesResult = await db.query(guidesQuery);
        const allGuides = guidesResult.rows;

        const scoredGuides = allGuides.map(guide => {
            let score = 0;
            let matchedPlaces = [];
            const matchReasons = [];

            const coveredLocations = guide.covered_locations
                ? guide.covered_locations.toLowerCase().split(',').map(loc => loc.trim()).filter(Boolean)
                : [];

            placeNames.forEach(placeName => {
                const directMatch = coveredLocations.some(loc => loc.includes(placeName) || placeName.includes(loc));
                if (directMatch) {
                    score += 18;
                    matchedPlaces.push(placeName);
                    matchReasons.push(`Matches ${placeName}`);
                }
            });

            if (guide.specialization && placeCategories.includes(guide.specialization)) {
                score += 12;
                matchReasons.push(`Specializes in ${guide.specialization}`);
            }

            if (guide.experience_years) {
                const experienceBoost = Math.min(guide.experience_years * 2, 20);
                score += experienceBoost;
                matchReasons.push(`${guide.experience_years} years of tour experience`);
            }

            if (guide.average_rating) {
                const ratingBoost = Number(guide.average_rating) * 8;
                score += ratingBoost;
                matchReasons.push(`Rated ${Number(guide.average_rating).toFixed(1)}/5 by travelers`);
            }

            if (guide.review_count) {
                score += Math.min(Number(guide.review_count) * 1.5, 8);
            }

            if (guide.languages) {
                score += Math.min(guide.languages.split(',').length * 2, 8);
            }

            if (guide.is_approved) {
                score += 5;
            }

            const normalizedScore = Math.round(score * 10) / 10;

            return {
                ...guide,
                match_score: normalizedScore,
                matched_places: [...new Set(matchedPlaces)],
                match_reasons: [...new Set(matchReasons)],
                covered_locations_array: coveredLocations,
                average_rating: Number(guide.average_rating || 0),
                review_count: Number(guide.review_count || 0),
                experience_years: Number(guide.experience_years || 0)
            };
        });

        const suggestedGuides = scoredGuides
            .filter(guide => guide.matched_places.length > 0 || guide.match_score > 0)
            .sort((a, b) => {
                if (b.match_score !== a.match_score) {
                    return b.match_score - a.match_score;
                }
                if ((b.experience_years || 0) !== (a.experience_years || 0)) {
                    return (b.experience_years || 0) - (a.experience_years || 0);
                }
                return (b.average_rating || 0) - (a.average_rating || 0);
            });

        return suggestedGuides;
    } catch (error) {
        console.error('Error suggesting guides for itinerary:', error);
        throw error;
    }
};

// Find guides by covered locations
const findGuidesByLocations = async (locationNames) => {
    try {
        if (!locationNames || locationNames.length === 0) return [];
        
        const conditions = locationNames.map((_, i) => `gp.covered_locations ILIKE '%' || $${i + 1} || '%'`).join(' OR ');
        
        const query = `
            SELECT gp.*, u.email 
            FROM guide_profiles gp
            JOIN users u ON gp.user_id = u.id
            WHERE u.role = 'guide' AND (${conditions})
        `;
        
        const result = await db.query(query, locationNames);
        return result.rows;
    } catch (error) {
        console.error('Error finding guides by locations:', error);
        throw error;
    }
};

module.exports = { 
    findUserByEmail, 
    createUser,
    getUserById,
    getUserProfile,
    updateTouristProfile,
    updateGuideProfile,
    getAllGuides,
    suggestGuidesForItinerary,
    findGuidesByLocations
};