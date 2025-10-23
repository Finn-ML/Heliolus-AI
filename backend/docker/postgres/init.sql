-- PostgreSQL initialization script for Heliolus Platform
-- This script will run when the PostgreSQL container starts for the first time

-- Create additional databases if needed
-- CREATE DATABASE heliolus_test;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create initial user roles (optional)
-- CREATE ROLE heliolus_app_user WITH LOGIN PASSWORD 'app_password';
-- GRANT CONNECT ON DATABASE heliumdb TO heliolus_app_user;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Heliolus PostgreSQL database initialized successfully';
END $$;