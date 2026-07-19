-- Admin Users and Roles
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY_ADMIN'
    department_id INTEGER REFERENCES departments(id), -- Nullable for global admins
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial Super Admin (username: admin, password: admin123)
INSERT INTO admin_users (username, password_hash, full_name, role, is_active)
VALUES (
    'admin', 
    '$2b$10$iPMMm3kt6DUdKKibjTrArOAqP27CMTEBjTpbacg6clrQJWBa4bYRe', 
    'System Administrator', 
    'SUPER_ADMIN', 
    true
) ON CONFLICT (username) DO NOTHING;
