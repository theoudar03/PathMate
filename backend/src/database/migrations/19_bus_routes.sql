-- Migration 19: Bus Route Board Management System
CREATE TABLE IF NOT EXISTS bus_routes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    route_date DATE DEFAULT CURRENT_DATE,
    session VARCHAR(20) NOT NULL CHECK (session IN ('morning', 'evening')),
    image_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    uploaded_by VARCHAR(100) DEFAULT 'College Administration',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bus_routes_session ON bus_routes(session);
CREATE INDEX IF NOT EXISTS idx_bus_routes_status ON bus_routes(status);
CREATE INDEX IF NOT EXISTS idx_bus_routes_date ON bus_routes(route_date);
