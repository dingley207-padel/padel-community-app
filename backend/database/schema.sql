-- Padel Community App Database Schema
-- PostgreSQL Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('member', 'manager');

-- OTP Medium Enum
CREATE TYPE otp_medium AS ENUM ('email', 'whatsapp');

-- Session Status Enum
CREATE TYPE session_status AS ENUM ('active', 'cancelled', 'completed');

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    otp_verified BOOLEAN DEFAULT FALSE,
    role user_role DEFAULT 'member',
    profile_image TEXT,
    location VARCHAR(255),
    skill_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Communities Table
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(255),
    profile_image TEXT,
    stripe_account_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    datetime TIMESTAMP NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    max_players INTEGER NOT NULL,
    booked_count INTEGER DEFAULT 0,
    status session_status DEFAULT 'active',
    visibility BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_capacity CHECK (booked_count <= max_players),
    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT positive_max_players CHECK (max_players > 0)
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    payment_status payment_status DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    UNIQUE(user_id, session_id)
);

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    status payment_status DEFAULT 'pending',
    stripe_txn_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- OTP Table
CREATE TABLE otp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier VARCHAR(255) NOT NULL, -- email or phone
    code VARCHAR(6) NOT NULL,
    medium otp_medium NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    CONSTRAINT valid_code CHECK (code ~ '^\d{6}$')
);

-- Community Members Table (for tracking which users are in which communities)
CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_sessions_community ON sessions(community_id);
CREATE INDEX idx_sessions_datetime ON sessions(datetime);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_stripe_txn ON payments(stripe_txn_id);
CREATE INDEX idx_otp_user_identifier ON otp(user_identifier);
CREATE INDEX idx_otp_expires ON otp(expires_at);
CREATE INDEX idx_community_members_user ON community_members(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to atomically increment booked_count when booking is created
CREATE OR REPLACE FUNCTION increment_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions
    SET booked_count = booked_count + 1
    WHERE id = NEW.session_id
    AND booked_count < max_players;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session is fully booked';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_increment_count BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION increment_booked_count();

-- Function to decrement booked_count when booking is cancelled
CREATE OR REPLACE FUNCTION decrement_booked_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL THEN
        UPDATE sessions
        SET booked_count = booked_count - 1
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_decrement_count BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION decrement_booked_count();

-- Views for easier querying

-- View for available sessions
CREATE VIEW available_sessions AS
SELECT
    s.*,
    c.name as community_name,
    c.location as community_location,
    (s.max_players - s.booked_count) as available_spots
FROM sessions s
JOIN communities c ON s.community_id = c.id
WHERE s.status = 'active'
AND s.datetime > CURRENT_TIMESTAMP
AND s.booked_count < s.max_players
AND s.visibility = TRUE;

-- View for manager dashboard
CREATE VIEW manager_bookings AS
SELECT
    b.id,
    b.user_id,
    u.name as user_name,
    u.email,
    u.phone,
    b.session_id,
    s.title as session_title,
    s.datetime as session_datetime,
    s.community_id,
    c.name as community_name,
    b.payment_status,
    b.timestamp as booking_time,
    p.amount,
    p.platform_fee,
    p.net_amount
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN sessions s ON b.session_id = s.id
JOIN communities c ON s.community_id = c.id
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.cancelled_at IS NULL;

-- Insert sample data (optional, for testing)
-- Uncomment to add test data

-- INSERT INTO users (name, email, role) VALUES
-- ('John Manager', 'john@example.com', 'manager'),
-- ('Jane Player', 'jane@example.com', 'member');
