const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * SEED DATA SCRIPT
 * Populates database with sample travel destinations
 * Run this after migrations to initialize the app with demo data
 */

const samplePlaces = [
    {
        name: 'Sigiriya Rock Fortress',
        description: 'UNESCO World Heritage Site featuring a 5th-century palace built atop a 200-meter rock column. Known as the "Eighth Wonder of the World", it offers stunning views and ancient frescoes. One of Sri Lanka\'s most iconic attractions.',
        latitude: 7.9571,
        longitude: 80.7597,
        category: 'Historical',
        image_url: 'https://asianindigoleisurelanka.com/wp-content/uploads/2025/02/Sigiriya-8th-Wonder-Sri-Lanka.jpg'
    },
    {
        name: 'Temple of the Tooth (Sri Dalada Maligawa)',
        description: 'Most sacred Buddhist temple in Kandy, housing what is believed to be a tooth relic of Buddha. Located in the heart of Kandy with stunning architecture and religious significance. A UNESCO World Heritage Site.',
        latitude: 7.2936,
        longitude: 80.6413,
        category: 'Religious',
        image_url: 'https://lakshmisharath.com/wp-content/uploads/2022/09/Kandy-toothrelictemple-dawn.jpg'
    },
    {
        name: 'Anuradhapura Ancient City',
        description: 'One of the oldest continuously inhabited cities in the world and UNESCO World Heritage Site. Features ancient temples, stupas, and the sacred Bodhi tree. Capital of Sri Lanka for over 1000 years.',
        latitude: 8.3142,
        longitude: 80.4167,
        category: 'Historical',
        image_url: 'https://tse1.mm.bing.net/th/id/OIP.XKQ_kZfvxbfuoEVla1tymQHaEh?rs=1&pid=ImgDetMain&o=7&rm=3'
    },
    {
        name: 'Polonnaruwa Ancient City',
        description: 'Second ancient capital of Sri Lanka featuring magnificent Buddhist temples and palaces from the 12th century. Famous for the Gal Vihara statue and intricate stone carvings. UNESCO World Heritage Site.',
        latitude: 7.9357,
        longitude: 81.0067,
        category: 'Historical',
        image_url: 'https://www.bluelankatours.com/wp-content/uploads/2020/02/DSC9479-copy.jpg'
    },
    {
        name: 'Ella Rock',
        description: 'Scenic mountain peak in the central highlands offering panoramic views of tea plantations and valleys. Popular hiking destination with a relatively easy trek. Located near Nine Arch Bridge.',
        latitude: 6.8667,
        longitude: 81.0433,
        category: 'Nature',
        image_url: 'https://th.bing.com/th/id/R.890715fe2c2fd2f34bfff7139ed9a253?rik=k3lC8NCLUdQ85A&riu=http%3a%2f%2fmochilerosviajeros.com%2fwp-content%2fuploads%2f2019%2f03%2fElla-Rock.jpg&ehk=3s1wfZtKv5Eg%2fvQ9NHILuPl%2btRGdwnoy31wcVUnQClA%3d&risl=&pid=ImgRaw&r=0'
    },
    {
        name: 'Adam\'s Peak (Sri Pada)',
        description: 'Sacred mountain with a footprint-shaped depression on its summit revered by Buddhists, Hindus, and Muslims. Elevation 2,243m with 5,500 steps to reach the peak. Spiritual pilgrimage destination.',
        latitude: 6.8096,
        longitude: 80.4994,
        category: 'Religious',
        image_url: 'https://tse4.mm.bing.net/th/id/OIP.Dnq5LTSnsGPNZqMvAN_8nQHaFB?rs=1&pid=ImgDetMain&o=7&rm=3'
    },
    {
        name: 'Nine Arch Bridge',
        description: 'Iconic colonial-era railway bridge built in 1921 with nine stone arches. Located in Ella, it\'s one of the most photographed bridges in Sri Lanka. Surrounded by lush green valleys and tea plantations.',
        latitude: 6.8768,
        longitude: 81.0608,
        category: 'Monument',
        image_url: 'https://i0.wp.com/www.tourbooking.lk/wp-content/uploads/2023/02/Nine-Arch-Bridge.jpg?fit=1920%2C1080&ssl=1'
    },
    {
        name: 'Mirissa Beach',
        description: 'Tropical beach in southern Sri Lanka known for whale watching (November-March) and spectacular sunsets. Pristine white sand and clear waters. Popular base for exploring the south coast.',
        latitude: 5.9431,
        longitude: 80.4600,
        category: 'Beach',
        image_url: 'https://i.pinimg.com/originals/e6/7b/18/e67b18f636852de9ca74b734503ac466.jpg'
    },
    {
        name: 'Unawatuna Beach',
        description: 'Picturesque crescent-shaped beach near Galle with golden sand and calm waters. Perfect for swimming, snorkeling, and water sports. Vibrant beach town with restaurants and accommodations.',
        latitude: 6.0135,
        longitude: 80.2486,
        category: 'Beach',
        image_url: 'https://turystycznyninja.pl/wp-content/uploads/2023/01/Unawatuna-Beach-Sri-Lanka-shutterstock.com-Marius-Dobilas.jpg'
    },
    {
        name: 'Galle Fort',
        description: 'UNESCO World Heritage Site and 16th-century coastal fort built by the Portuguese. Completely surrounded by a massive fortified wall with historic significance. Features colonial architecture and museums.',
        latitude: 6.0287,
        longitude: 80.2180,
        category: 'Historical',
        image_url: 'https://www.lankaislandproperties.com/wp-content/uploads/2021/11/Galle-Fort.jpg'
    },
    {
        name: 'Nuwara Eliya',
        description: 'Hill station in central highlands at 1,868m elevation. Known as "Little England" with colonial architecture, golf course, and cool climate. Gateway to Horton Plains and scenic tea country.',
        latitude: 6.9707,
        longitude: 80.7829,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Horton Plains National Park',
        description: 'Scenic plateau with stunning views, hiking trails, and unique flora/fauna. Famous for the "World\'s End" cliff viewpoint and Baker\'s Falls. Altitude 2,100m-2,295m with cool mountain climate.',
        latitude: 6.8217,
        longitude: 80.8358,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Kandy Lake',
        description: 'Artificial lake in the heart of Kandy surrounded by walking paths, gardens, and temples. Built in 1807, it\'s an iconic landmark with reflection of hills and temples. Evening strolls are popular.',
        latitude: 7.2911,
        longitude: 80.6419,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Dambulla Cave Temple',
        description: 'Sacred Buddhist temple complex with five caves containing 153 Buddha statues and intricate murals. Five stories high with gold roof. One of the oldest and most visited cave temples in Sri Lanka.',
        latitude: 7.8674,
        longitude: 80.6596,
        category: 'Religious',
        image_url: 'https://www.travelmapsrilanka.com/destinations/destinationimages/dambulla-cave-temple.webp'
    },
    {
        name: 'Peradeniya Botanical Gardens',
        description: 'Lush botanical gardens near Kandy covering 147 acres. Home to over 4,000 species of plants, orchids, and giant bamboo. Scenic walking paths along the Mahaweli River.',
        latitude: 7.2705,
        longitude: 80.5916,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Colombo National Museum',
        description: 'Premier museum featuring Sri Lankan art, artifacts, and natural history exhibits. Housed in a Victorian building with collections spanning from prehistoric times to modern era. Includes royal regalia and Buddhist sculptures.',
        latitude: 6.9142,
        longitude: 79.8606,
        category: 'Museum',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Mount Lavinia Beach',
        description: 'Golden sandy beach in Colombo suburb with calm waters and vibrant atmosphere. Named after a legendary love story. Home to Mount Lavinia Hotel and water sports facilities.',
        latitude: 6.8374,
        longitude: 79.8631,
        category: 'Beach',
        image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSl9nNzK-D7WepYIGfIT2AeKf8CYJg3HEvoFKYGIHzCwA&s=10'
    },
    {
        name: 'Uda Walawe National Park',
        description: 'Large national park known for elephant herds, buffalo, and diverse wildlife. 30,821 hectares with scenic landscape and reservoir. Popular for safari tours and wildlife photography.',
        latitude: 6.4671,
        longitude: 80.8186,
        category: 'Wildlife',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Sinharaja Rainforest',
        description: 'UNESCO World Heritage tropical rainforest with rich biodiversity. Home to endemic species including leopards, elephants, and rare birds. Pristine wilderness perfect for nature lovers and birdwatchers.',
        latitude: 6.4233,
        longitude: 80.4213,
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    },
    {
        name: 'Yala National Park',
        description: 'Largest national park in Sri Lanka with highest concentration of leopards. Covers 97,881 hectares with savanna landscape. Excellent for safari tours and spotting elephants, crocodiles, and birds.',
        latitude: 6.1900,
        longitude: 81.5150,
        category: 'Wildlife',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400'
    }
];

const sampleGuides = [
    {
        email: 'guide1@example.com',
        password: 'password123',
        full_name: 'Dinesh Perera',
        bio: 'Certified heritage guide with over a decade of experience guiding tourists through the ancient ruins of Sigiriya, Polonnaruwa, and Anuradhapura.',
        license_number: 'GUIDE-SL-001',
        hourly_rate: 18.00,
        contact_number: '+94 77 123 4567',
        profile_image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300&q=80',
        specialization: 'Cultural Triangle & Heritage Sites',
        experience_years: 10,
        languages: 'English, Sinhala, Japanese',
        covered_locations: 'Sigiriya Rock Fortress, Anuradhapura Ancient City, Polonnaruwa Ancient City'
    },
    {
        email: 'guide2@example.com',
        password: 'password123',
        full_name: 'Sarah Wijesinghe',
        bio: 'Wildlife biologist and passionate eco-tourism guide. Specializes in leopard and elephant tracking safaris in Yala and Uda Walawe.',
        license_number: 'GUIDE-SL-002',
        hourly_rate: 20.00,
        contact_number: '+94 71 987 6543',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300&q=80',
        specialization: 'Wildlife Safaris & Eco-Tourism',
        experience_years: 8,
        languages: 'English, Sinhala, French',
        covered_locations: 'Yala National Park, Uda Walawe National Park, Sinharaja Rainforest'
    },
    {
        email: 'guide3@example.com',
        password: 'password123',
        full_name: 'Kamal Silva',
        bio: 'Adventure climber and mountain guide. Specializes in multi-day trekking journeys to Ella Rock, Horton Plains, and Adam\'s Peak climbs.',
        license_number: 'GUIDE-SL-003',
        hourly_rate: 16.50,
        contact_number: '+94 76 555 4444',
        profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300&q=80',
        specialization: 'Adventure Trekking & Hiking',
        experience_years: 12,
        languages: 'English, Sinhala, German',
        covered_locations: 'Ella Rock, Horton Plains National Park, Adam\'s Peak (Sri Pada)'
    },
    {
        email: 'guide4@example.com',
        password: 'password123',
        full_name: 'Nimali Fernando',
        bio: 'Food enthusiast and local culinary expert. Guiding travelers through tea estates, traditional Sri Lankan kitchen classes, and estate factory tours.',
        license_number: 'GUIDE-SL-004',
        hourly_rate: 15.00,
        contact_number: '+94 71 112 3344',
        profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300&q=80',
        specialization: 'Culinary Tours & Tea Estate Experiences',
        experience_years: 6,
        languages: 'English, Sinhala, Tamil',
        covered_locations: 'Nuwara Eliya, Peradeniya Botanical Gardens, Kandy Lake'
    }
];

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // Insert sample places
        for (const place of samplePlaces) {
            const query = `
                INSERT INTO places (name, description, latitude, longitude, category, image_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (name) DO NOTHING
            `;

            await db.query(query, [
                place.name,
                place.description,
                place.latitude,
                place.longitude,
                place.category,
                place.image_url
            ]);

            console.log(`✓ Added: ${place.name}`);
        }

        // Insert sample guides
        console.log('\nSeeding travel guides...');
        for (const guide of sampleGuides) {
            // 1. Create User
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(guide.password, saltRounds);

            const userResult = await db.query(
                `INSERT INTO users (email, password_hash, role) 
                 VALUES ($1, $2, 'guide') 
                 ON CONFLICT (email) DO UPDATE SET role = 'guide'
                 RETURNING id`,
                [guide.email, passwordHash]
            );

            const userId = userResult.rows[0].id;

            // 2. Create Guide Profile
            const profileQuery = `
                INSERT INTO guide_profiles 
                (user_id, full_name, bio, license_number, hourly_rate, contact_number, profile_image_url, specialization, experience_years, languages, covered_locations, is_approved)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
                ON CONFLICT (user_id) DO UPDATE SET 
                    full_name = $2, bio = $3, license_number = $4, hourly_rate = $5,
                    contact_number = $6, profile_image_url = $7, specialization = $8,
                    experience_years = $9, languages = $10, covered_locations = $11, is_approved = TRUE
            `;

            await db.query(profileQuery, [
                userId, guide.full_name, guide.bio, guide.license_number, guide.hourly_rate,
                guide.contact_number, guide.profile_image_url, guide.specialization,
                guide.experience_years, guide.languages, guide.covered_locations
            ]);

            console.log(`✓ Added Guide: ${guide.full_name}`);
        }

        console.log('\n✓ Database seeding completed successfully!');
        console.log(`Total places added: ${samplePlaces.length}`);

    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('Seed script completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('Seed script failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
