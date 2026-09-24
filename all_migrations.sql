-- 001_create_users.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('tourist', 'guide', 'admin');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'tourist',
    
    -- Security Requirement for MVP:
    is_verified BOOLEAN DEFAULT FALSE, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS guide_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL, -- 1-to-1 relationship
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    license_number VARCHAR(50) UNIQUE,
    hourly_rate DECIMAL(10, 2),
    is_approved BOOLEAN DEFAULT FALSE, -- Human-in-the-loop: Admin must approve guides
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tourist_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL, 
    longitude DECIMAL(11, 8) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(500),
    -- VIVA PREP: We use standard DECIMALs for lat/long for now. In Sprint 2, when we need spatial queries ("find places within 5km"), we will alter this table to use PostGIS Geometry types. Plan for the future, but build for today.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    tourist_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itinerary_items (
    id SERIAL PRIMARY KEY,
    itinerary_id INT NOT NULL,
    place_id INT NOT NULL,
    visit_order INT NOT NULL, 
    -- VIVA PREP: The 'visit_order' column is HOW you implement drag-and-drop. 
    -- When a user reorders the route in React, the frontend sends an array of Item IDs. 
    -- Your Node backend will run a transaction to update this 'visit_order' integer for each item.
    notes TEXT,
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE RESTRICT
    -- VIVA PREP: 'ON DELETE RESTRICT' for places. If an Admin tries to delete the 'Sigiriya' place record, the database will BLOCK it if tourists have Sigiriya in their itineraries. This prevents breaking user data.
);
CREATE TABLE IF NOT EXISTS place_reviews (
    id SERIAL PRIMARY KEY,
    place_id INT NOT NULL,
    tourist_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5), -- Database-level constraint
    title TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS guide_reviews (
    id SERIAL PRIMARY KEY,
    guide_id INT NOT NULL, -- Refers to the user_id of the guide
    tourist_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guide_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tourist_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Add created_at column to itineraries table if it doesn't exist
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS covered_locations TEXT;
-- 008_add_contact_to_guides.sql
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='contact_number') THEN
        ALTER TABLE guide_profiles ADD COLUMN contact_number VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='profile_image_url') THEN
        ALTER TABLE guide_profiles ADD COLUMN profile_image_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='specialization') THEN
        ALTER TABLE guide_profiles ADD COLUMN specialization VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='experience_years') THEN
        ALTER TABLE guide_profiles ADD COLUMN experience_years INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guide_profiles' AND column_name='languages') THEN
        ALTER TABLE guide_profiles ADD COLUMN languages VARCHAR(255);
    END IF;
END $$;
-- Migration: Add covered_locations to guide_profiles
-- Description: Adds a column to store the locations a guide covers

ALTER TABLE guide_profiles ADD COLUMN IF NOT EXISTS covered_locations TEXT;
-- Migration: Create bookings table
-- Description: Stores booking requests between tourists and guides

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
    guide_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tourist_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, quoted, accepted, rejected, cancelled
    quoted_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
-- 011_add_contact_to_tourists.sql
ALTER TABLE tourist_profiles ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
-- 012_update_quoted_price_type.sql
-- Change quoted_price from DECIMAL to VARCHAR to support currency symbols and flexible pricing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'bookings'
          AND column_name = 'quoted_price'
          AND data_type <> 'character varying'
    ) THEN
        ALTER TABLE bookings ALTER COLUMN quoted_price TYPE VARCHAR(50);
    END IF;
END$$;
ALTER TABLE place_reviews
ADD COLUMN IF NOT EXISTS title TEXT;
-- Migration: Create booking messages table
-- Description: Stores chat-style messages for booking requests between tourists and guides

CREATE TABLE IF NOT EXISTS booking_messages (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 014_add_unique_itinerary_place_constraint.sql
-- Ensure a place cannot be added more than once to the same itinerary

WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY itinerary_id, place_id ORDER BY id) AS row_num
    FROM itinerary_items
)
DELETE FROM itinerary_items
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'i'
          AND c.relname = 'idx_itinerary_items_itinerary_place'
    ) THEN
        CREATE UNIQUE INDEX idx_itinerary_items_itinerary_place
        ON itinerary_items(itinerary_id, place_id);
    END IF;
END$$;
-- Migration: Add edit and delete support to booking messages

ALTER TABLE booking_messages
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
-- 015_add_title_to_place_reviews_if_missing.sql
-- Add title column to place_reviews if it is missing

ALTER TABLE place_reviews
ADD COLUMN IF NOT EXISTS title TEXT;
-- Migration: 016_add_profile_image_to_tourists.sql
-- Add profile_image_url to tourist_profiles table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tourist_profiles' AND column_name='profile_image_url') THEN
        ALTER TABLE tourist_profiles ADD COLUMN profile_image_url TEXT;
    END IF;
END $$;
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
