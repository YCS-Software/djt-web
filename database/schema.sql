-- EV Charging Management Platform - Database Schema
-- PostgreSQL 15+
-- Version: 1.0
-- Date: June 2026

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- AUTHENTICATION & AUTHORIZATION
-- ============================================

-- Roles table
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL UNIQUE,
    display_name    VARCHAR(100) NOT NULL,
    description     TEXT,
    is_system       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    display_name    VARCHAR(150) NOT NULL,
    module          VARCHAR(50) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    role_id         UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- PARTNERS
-- ============================================

-- Partners table
CREATE TABLE partners (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    legal_name      VARCHAR(200),
    email           VARCHAR(255) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL,
    address         TEXT NOT NULL,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    gst_number      VARCHAR(20),
    pan_number      VARCHAR(20),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'suspended')),
    logo_url        VARCHAR(500),
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- Partner wallets
CREATE TABLE partner_wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL UNIQUE REFERENCES partners(id) ON DELETE CASCADE,
    balance         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_earned    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_settled   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID REFERENCES partners(id) ON DELETE SET NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified  BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    failed_attempts INTEGER DEFAULT 0,
    locked_until    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- User-Role mapping
CREATE TABLE user_roles (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Partner settlements
CREATE TABLE partner_settlements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL REFERENCES partners(id),
    amount          DECIMAL(12,2) NOT NULL,
    commission      DECIMAL(12,2) NOT NULL,
    net_amount      DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payment_ref     VARCHAR(100),
    bank_details    JSONB,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    processed_at    TIMESTAMP WITH TIME ZONE,
    processed_by    UUID REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INFRASTRUCTURE
-- ============================================

-- Locations table
CREATE TABLE locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    address         TEXT NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(10) NOT NULL,
    country         VARCHAR(50) NOT NULL DEFAULT 'India',
    latitude        DECIMAL(10,8) NOT NULL,
    longitude       DECIMAL(11,8) NOT NULL,
    operating_hours JSONB DEFAULT '{"monday":{"open":"06:00","close":"22:00"},"tuesday":{"open":"06:00","close":"22:00"},"wednesday":{"open":"06:00","close":"22:00"},"thursday":{"open":"06:00","close":"22:00"},"friday":{"open":"06:00","close":"22:00"},"saturday":{"open":"06:00","close":"22:00"},"sunday":{"open":"06:00","close":"22:00"}}',
    amenities       TEXT[] DEFAULT '{}',
    images          TEXT[] DEFAULT '{}',
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(255),
    directions      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'coming_soon')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- Charging stations table
CREATE TABLE charging_stations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    ocpp_identity       VARCHAR(50) NOT NULL UNIQUE,
    name                VARCHAR(100),
    vendor              VARCHAR(100),
    model               VARCHAR(100),
    serial_number       VARCHAR(100),
    firmware_version    VARCHAR(50),
    iccid               VARCHAR(30),
    imsi                VARCHAR(30),
    is_online           BOOLEAN DEFAULT FALSE,
    last_heartbeat      TIMESTAMP WITH TIME ZONE,
    last_boot           TIMESTAMP WITH TIME ZONE,
    boot_notification   JSONB,
    configuration       JSONB DEFAULT '{}',
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'maintenance')),
    error_code          VARCHAR(50),
    error_info          TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP WITH TIME ZONE
);

-- Tariffs table (created before connectors due to FK)
CREATE TABLE tariffs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    energy_rate     DECIMAL(8,4),
    time_rate       DECIMAL(8,4),
    session_fee     DECIMAL(8,2),
    idle_fee_rate   DECIMAL(8,4),
    idle_grace_minutes INTEGER DEFAULT 5,
    tax_rate        DECIMAL(5,2) DEFAULT 18.00,
    min_amount      DECIMAL(10,2) DEFAULT 0.00,
    max_amount      DECIMAL(10,2),
    is_default      BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
    valid_from      DATE,
    valid_until     DATE,
    time_of_use     JSONB,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- Connectors table
CREATE TABLE connectors (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id          UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    tariff_id           UUID REFERENCES tariffs(id) ON DELETE SET NULL,
    connector_id        INTEGER NOT NULL,
    connector_type      VARCHAR(20) NOT NULL
                        CHECK (connector_type IN ('CCS1', 'CCS2', 'CHAdeMO', 'Type1', 'Type2', 'GBT')),
    power_kw            DECIMAL(6,2) NOT NULL,
    voltage             INTEGER,
    amperage            INTEGER,
    ocpp_status         VARCHAR(30) NOT NULL DEFAULT 'Unavailable'
                        CHECK (ocpp_status IN ('Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted')),
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'maintenance')),
    last_status_update  TIMESTAMP WITH TIME ZONE,
    error_code          VARCHAR(50),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (station_id, connector_id)
);

-- ============================================
-- EV DRIVERS
-- ============================================

-- EV Drivers table
CREATE TABLE ev_drivers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    email           VARCHAR(255) UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    avatar_url      VARCHAR(500),
    date_of_birth   DATE,
    gender          VARCHAR(10),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'suspended')),
    phone_verified  BOOLEAN DEFAULT TRUE,
    email_verified  BOOLEAN DEFAULT FALSE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    notification_preferences JSONB DEFAULT '{"sms":true,"email":true,"push":true}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP WITH TIME ZONE
);

-- Driver wallets
CREATE TABLE driver_wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL UNIQUE REFERENCES ev_drivers(id) ON DELETE CASCADE,
    balance         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    low_balance_alert DECIMAL(10,2) DEFAULT 100.00,
    auto_topup      BOOLEAN DEFAULT FALSE,
    auto_topup_amount DECIMAL(10,2) DEFAULT 500.00,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Driver vehicles
CREATE TABLE driver_vehicles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id           UUID NOT NULL REFERENCES ev_drivers(id) ON DELETE CASCADE,
    make                VARCHAR(100) NOT NULL,
    model               VARCHAR(100) NOT NULL,
    year                INTEGER,
    registration_number VARCHAR(20),
    color               VARCHAR(50),
    battery_capacity_kwh DECIMAL(6,2),
    preferred_connector VARCHAR(20),
    is_primary          BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP WITH TIME ZONE
);

-- RFID Cards
CREATE TABLE rfid_cards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID REFERENCES ev_drivers(id) ON DELETE SET NULL,
    card_number     VARCHAR(50) NOT NULL UNIQUE,
    uid             VARCHAR(50) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'blocked', 'expired', 'lost')),
    valid_from      DATE,
    valid_until     DATE,
    assigned_at     TIMESTAMP WITH TIME ZONE,
    blocked_at      TIMESTAMP WITH TIME ZONE,
    blocked_reason  TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPORT TABLES (needed before sessions)
-- ============================================

-- Coupons table
CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id      UUID REFERENCES partners(id) ON DELETE CASCADE,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    discount_type   VARCHAR(20) NOT NULL
                    CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  DECIMAL(10,2) NOT NULL,
    max_discount    DECIMAL(10,2),
    min_amount      DECIMAL(10,2) DEFAULT 0.00,
    usage_limit     INTEGER,
    usage_count     INTEGER DEFAULT 0,
    per_user_limit  INTEGER DEFAULT 1,
    valid_from      TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until     TIMESTAMP WITH TIME ZONE NOT NULL,
    applicable_to   VARCHAR(30) DEFAULT 'all'
                    CHECK (applicable_to IN ('all', 'new_users', 'specific_locations')),
    locations       UUID[],
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'expired')),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OPERATIONS
-- ============================================

-- Sessions table
CREATE TABLE sessions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id        UUID NOT NULL REFERENCES connectors(id),
    driver_id           UUID REFERENCES ev_drivers(id) ON DELETE SET NULL,
    rfid_card_id        UUID REFERENCES rfid_cards(id) ON DELETE SET NULL,
    vehicle_id          UUID REFERENCES driver_vehicles(id) ON DELETE SET NULL,
    tariff_id           UUID REFERENCES tariffs(id) ON DELETE SET NULL,
    transaction_id      INTEGER,
    id_tag              VARCHAR(50),
    start_method        VARCHAR(20) NOT NULL DEFAULT 'qr'
                        CHECK (start_method IN ('qr', 'rfid', 'remote', 'plug_and_charge')),
    start_time          TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time            TIMESTAMP WITH TIME ZONE,
    start_meter_wh      INTEGER NOT NULL DEFAULT 0,
    end_meter_wh        INTEGER,
    energy_consumed_kwh DECIMAL(10,3) DEFAULT 0,
    duration_minutes    INTEGER DEFAULT 0,
    idle_minutes        INTEGER DEFAULT 0,
    energy_amount       DECIMAL(10,2) DEFAULT 0.00,
    time_amount         DECIMAL(10,2) DEFAULT 0.00,
    session_fee         DECIMAL(10,2) DEFAULT 0.00,
    idle_fee            DECIMAL(10,2) DEFAULT 0.00,
    subtotal            DECIMAL(10,2) DEFAULT 0.00,
    tax_amount          DECIMAL(10,2) DEFAULT 0.00,
    discount_amount     DECIMAL(10,2) DEFAULT 0.00,
    total_amount        DECIMAL(10,2) DEFAULT 0.00,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'active', 'completed', 'failed', 'cancelled')),
    stop_reason         VARCHAR(50),
    error_code          VARCHAR(50),
    error_info          TEXT,
    coupon_id           UUID REFERENCES coupons(id),
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session logs
CREATE TABLE session_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    event_data      JSONB,
    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session meter values
CREATE TABLE session_meter_values (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp       TIMESTAMP WITH TIME ZONE NOT NULL,
    measurand       VARCHAR(50) NOT NULL,
    value           VARCHAR(50) NOT NULL,
    unit            VARCHAR(20),
    phase           VARCHAR(10),
    context         VARCHAR(30),
    format          VARCHAR(20),
    location        VARCHAR(20),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reservations
CREATE TABLE reservations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id    UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES ev_drivers(id) ON DELETE CASCADE,
    reservation_id  INTEGER NOT NULL,
    start_time      TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time        TIMESTAMP WITH TIME ZONE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'used', 'expired', 'cancelled')),
    id_tag          VARCHAR(50),
    parent_id_tag   VARCHAR(50),
    cancelled_at    TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FINANCE
-- ============================================

-- Transactions table
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id          UUID REFERENCES sessions(id) ON DELETE SET NULL,
    driver_id           UUID REFERENCES ev_drivers(id) ON DELETE SET NULL,
    partner_id          UUID REFERENCES partners(id) ON DELETE SET NULL,
    type                VARCHAR(30) NOT NULL
                        CHECK (type IN ('session_charge', 'wallet_topup', 'refund', 'settlement', 'adjustment')),
    amount              DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method      VARCHAR(30),
    payment_gateway     VARCHAR(30),
    gateway_order_id    VARCHAR(100),
    gateway_payment_id  VARCHAR(100),
    gateway_signature   VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    failure_reason      TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE wallet_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_type     VARCHAR(20) NOT NULL CHECK (wallet_type IN ('driver', 'partner')),
    driver_id       UUID REFERENCES ev_drivers(id) ON DELETE SET NULL,
    partner_id      UUID REFERENCES partners(id) ON DELETE SET NULL,
    transaction_id  UUID REFERENCES transactions(id),
    session_id      UUID REFERENCES sessions(id),
    type            VARCHAR(30) NOT NULL
                    CHECK (type IN ('credit', 'debit')),
    category        VARCHAR(30) NOT NULL
                    CHECK (category IN ('topup', 'charge', 'refund', 'settlement', 'adjustment', 'coupon')),
    amount          DECIMAL(10,2) NOT NULL,
    balance_before  DECIMAL(10,2) NOT NULL,
    balance_after   DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    description     TEXT,
    reference       VARCHAR(100),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (wallet_type = 'driver' AND driver_id IS NOT NULL) OR
        (wallet_type = 'partner' AND partner_id IS NOT NULL)
    )
);

-- Refunds
CREATE TABLE refunds (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id      UUID NOT NULL REFERENCES transactions(id),
    session_id          UUID REFERENCES sessions(id),
    driver_id           UUID REFERENCES ev_drivers(id),
    amount              DECIMAL(10,2) NOT NULL,
    reason              TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    gateway_refund_id   VARCHAR(100),
    processed_at        TIMESTAMP WITH TIME ZONE,
    processed_by        UUID REFERENCES users(id),
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SUPPORT
-- ============================================

-- Coupon usage
CREATE TABLE coupon_usage (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id       UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES ev_drivers(id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    driver_id       UUID NOT NULL REFERENCES ev_drivers(id) ON DELETE CASCADE,
    location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    station_id      UUID REFERENCES charging_stations(id) ON DELETE SET NULL,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    response        TEXT,
    responded_at    TIMESTAMP WITH TIME ZONE,
    responded_by    UUID REFERENCES users(id),
    is_visible      BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disputes
CREATE TABLE disputes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      UUID REFERENCES sessions(id),
    transaction_id  UUID REFERENCES transactions(id),
    driver_id       UUID NOT NULL REFERENCES ev_drivers(id),
    partner_id      UUID NOT NULL REFERENCES partners(id),
    category        VARCHAR(50) NOT NULL
                    CHECK (category IN ('incorrect_billing', 'session_not_started', 'payment_issue', 'station_malfunction', 'other')),
    subject         VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'escalated')),
    priority        VARCHAR(20) DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    resolution      TEXT,
    refund_amount   DECIMAL(10,2),
    assigned_to     UUID REFERENCES users(id),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    resolved_by     UUID REFERENCES users(id),
    attachments     TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Card requests
CREATE TABLE card_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id       UUID NOT NULL REFERENCES ev_drivers(id) ON DELETE CASCADE,
    request_type    VARCHAR(20) NOT NULL
                    CHECK (request_type IN ('new', 'replacement', 'additional')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'shipped', 'delivered')),
    shipping_address JSONB NOT NULL,
    tracking_number VARCHAR(100),
    rfid_card_id    UUID REFERENCES rfid_cards(id),
    rejection_reason TEXT,
    processed_at    TIMESTAMP WITH TIME ZONE,
    processed_by    UUID REFERENCES users(id),
    shipped_at      TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SYSTEM
-- ============================================

-- QR Codes
CREATE TABLE qr_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_id    UUID NOT NULL UNIQUE REFERENCES connectors(id) ON DELETE CASCADE,
    code            VARCHAR(100) NOT NULL UNIQUE,
    payload         JSONB NOT NULL,
    image_url       VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    scans_count     INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type       VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'driver')),
    user_id         UUID,
    driver_id       UUID,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    data            JSONB,
    channel         VARCHAR(20) NOT NULL
                    CHECK (channel IN ('in_app', 'sms', 'email', 'push')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    sent_at         TIMESTAMP WITH TIME ZONE,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (user_type = 'user' AND user_id IS NOT NULL) OR
        (user_type = 'driver' AND driver_id IS NOT NULL)
    )
);

-- Audit logs
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    user_type       VARCHAR(20),
    action          VARCHAR(50) NOT NULL,
    resource        VARCHAR(50) NOT NULL,
    resource_id     UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    request_id      VARCHAR(100),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OCPP logs
CREATE TABLE ocpp_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id      UUID REFERENCES charging_stations(id) ON DELETE SET NULL,
    ocpp_identity   VARCHAR(50) NOT NULL,
    direction       VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    message_type    VARCHAR(30) NOT NULL,
    message_id      VARCHAR(50),
    action          VARCHAR(50),
    payload         JSONB,
    error_code      VARCHAR(50),
    error_description TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Server logs
CREATE TABLE server_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level           VARCHAR(10) NOT NULL,
    message         TEXT NOT NULL,
    context         JSONB,
    request_id      VARCHAR(100),
    source          VARCHAR(100),
    stack_trace     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_partner_id ON users(partner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

-- Partners indexes
CREATE INDEX idx_partners_status ON partners(status) WHERE deleted_at IS NULL;

-- Locations indexes
CREATE INDEX idx_locations_partner_id ON locations(partner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_city ON locations(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_status ON locations(status) WHERE deleted_at IS NULL;

-- Charging stations indexes
CREATE INDEX idx_stations_location_id ON charging_stations(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stations_ocpp_identity ON charging_stations(ocpp_identity);
CREATE INDEX idx_stations_is_online ON charging_stations(is_online) WHERE deleted_at IS NULL;

-- Connectors indexes
CREATE INDEX idx_connectors_station_id ON connectors(station_id);
CREATE INDEX idx_connectors_ocpp_status ON connectors(ocpp_status);
CREATE INDEX idx_connectors_tariff_id ON connectors(tariff_id);

-- EV Drivers indexes
CREATE INDEX idx_ev_drivers_phone ON ev_drivers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_ev_drivers_email ON ev_drivers(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_ev_drivers_status ON ev_drivers(status) WHERE deleted_at IS NULL;

-- Sessions indexes
CREATE INDEX idx_sessions_connector_id ON sessions(connector_id);
CREATE INDEX idx_sessions_driver_id ON sessions(driver_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_transaction_id ON sessions(transaction_id);

-- Transactions indexes
CREATE INDEX idx_transactions_session_id ON transactions(session_id);
CREATE INDEX idx_transactions_driver_id ON transactions(driver_id);
CREATE INDEX idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- RFID cards indexes
CREATE INDEX idx_rfid_cards_driver_id ON rfid_cards(driver_id);
CREATE INDEX idx_rfid_cards_uid ON rfid_cards(uid);
CREATE INDEX idx_rfid_cards_status ON rfid_cards(status);

-- Reservations indexes
CREATE INDEX idx_reservations_connector_id ON reservations(connector_id);
CREATE INDEX idx_reservations_driver_id ON reservations(driver_id);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- OCPP logs indexes
CREATE INDEX idx_ocpp_logs_station_id ON ocpp_logs(station_id);
CREATE INDEX idx_ocpp_logs_ocpp_identity ON ocpp_logs(ocpp_identity);
CREATE INDEX idx_ocpp_logs_action ON ocpp_logs(action);
CREATE INDEX idx_ocpp_logs_created_at ON ocpp_logs(created_at);

-- Full-text search indexes
CREATE INDEX idx_locations_search ON locations USING GIN (
    to_tsvector('english', name || ' ' || address || ' ' || city)
);

-- ============================================
-- SEED DATA: ROLES & PERMISSIONS
-- ============================================

-- Insert default roles
INSERT INTO roles (name, display_name, description, is_system) VALUES
('super_admin', 'Super Administrator', 'Full platform access', true),
('partner_admin', 'Partner Administrator', 'Full partner organization access', true),
('operator', 'Operator', 'Day-to-day operations access', true),
('viewer', 'Viewer', 'Read-only access', true);

-- Insert permissions
INSERT INTO permissions (name, display_name, module) VALUES
-- Dashboard
('view:dashboard', 'View Dashboard', 'dashboard'),
-- Users
('view:users', 'View Users', 'users'),
('create:users', 'Create Users', 'users'),
('update:users', 'Update Users', 'users'),
('delete:users', 'Delete Users', 'users'),
-- Partners
('view:partners', 'View Partners', 'partners'),
('create:partners', 'Create Partners', 'partners'),
('update:partners', 'Update Partners', 'partners'),
('delete:partners', 'Delete Partners', 'partners'),
('manage:settlements', 'Manage Settlements', 'partners'),
-- Locations
('view:locations', 'View Locations', 'locations'),
('create:locations', 'Create Locations', 'locations'),
('update:locations', 'Update Locations', 'locations'),
('delete:locations', 'Delete Locations', 'locations'),
-- Stations
('view:stations', 'View Stations', 'stations'),
('create:stations', 'Create Stations', 'stations'),
('update:stations', 'Update Stations', 'stations'),
('delete:stations', 'Delete Stations', 'stations'),
('control:stations', 'Control Stations (Remote Start/Stop/Reset)', 'stations'),
-- Connectors
('view:connectors', 'View Connectors', 'connectors'),
('create:connectors', 'Create Connectors', 'connectors'),
('update:connectors', 'Update Connectors', 'connectors'),
('delete:connectors', 'Delete Connectors', 'connectors'),
-- Drivers
('view:drivers', 'View Drivers', 'drivers'),
('create:drivers', 'Create Drivers', 'drivers'),
('update:drivers', 'Update Drivers', 'drivers'),
('delete:drivers', 'Delete Drivers', 'drivers'),
-- Sessions
('view:sessions', 'View Sessions', 'sessions'),
('control:sessions', 'Control Sessions (Start/Stop)', 'sessions'),
-- Tariffs
('view:tariffs', 'View Tariffs', 'tariffs'),
('create:tariffs', 'Create Tariffs', 'tariffs'),
('update:tariffs', 'Update Tariffs', 'tariffs'),
('delete:tariffs', 'Delete Tariffs', 'tariffs'),
-- RFID Cards
('view:cards', 'View RFID Cards', 'cards'),
('create:cards', 'Create RFID Cards', 'cards'),
('update:cards', 'Update RFID Cards', 'cards'),
('delete:cards', 'Delete RFID Cards', 'cards'),
-- Reports
('view:reports', 'View Reports', 'reports'),
('export:reports', 'Export Reports', 'reports'),
-- Disputes
('view:disputes', 'View Disputes', 'disputes'),
('manage:disputes', 'Manage Disputes', 'disputes'),
-- Coupons
('view:coupons', 'View Coupons', 'coupons'),
('create:coupons', 'Create Coupons', 'coupons'),
('update:coupons', 'Update Coupons', 'coupons'),
('delete:coupons', 'Delete Coupons', 'coupons'),
-- Logs
('view:audit_logs', 'View Audit Logs', 'logs'),
('view:ocpp_logs', 'View OCPP Logs', 'logs'),
('view:server_logs', 'View Server Logs', 'logs');

-- Assign all permissions to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'super_admin';

-- Assign partner permissions to partner_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'partner_admin'
AND p.name NOT IN ('view:partners', 'create:partners', 'update:partners', 'delete:partners', 'manage:settlements', 'view:server_logs');

-- Assign operator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operator'
AND p.name IN (
    'view:dashboard', 'view:locations', 'view:stations', 'view:connectors',
    'control:stations', 'view:drivers', 'view:sessions', 'control:sessions',
    'view:tariffs', 'view:cards', 'view:reports', 'view:disputes', 'manage:disputes',
    'view:ocpp_logs'
);

-- Assign viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer'
AND p.name LIKE 'view:%';

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_wallets_updated_at BEFORE UPDATE ON partner_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_settlements_updated_at BEFORE UPDATE ON partner_settlements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charging_stations_updated_at BEFORE UPDATE ON charging_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ev_drivers_updated_at BEFORE UPDATE ON ev_drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_wallets_updated_at BEFORE UPDATE ON driver_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_vehicles_updated_at BEFORE UPDATE ON driver_vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfid_cards_updated_at BEFORE UPDATE ON rfid_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_requests_updated_at BEFORE UPDATE ON card_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create partner wallet automatically
CREATE OR REPLACE FUNCTION create_partner_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO partner_wallets (partner_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_partner_wallet_trigger
AFTER INSERT ON partners
FOR EACH ROW EXECUTE FUNCTION create_partner_wallet();

-- Function to create driver wallet automatically
CREATE OR REPLACE FUNCTION create_driver_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO driver_wallets (driver_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_driver_wallet_trigger
AFTER INSERT ON ev_drivers
FOR EACH ROW EXECUTE FUNCTION create_driver_wallet();

-- ============================================
-- END OF SCHEMA
-- ============================================
