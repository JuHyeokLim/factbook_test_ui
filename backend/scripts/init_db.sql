-- Create Database
CREATE DATABASE factbook_db;

-- Connect to the new database
\c factbook_db;

-- Factbooks Table
CREATE TABLE factbooks (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    competitors JSONB,
    proposal_areas JSONB,
    advertising_types JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_factbooks_company ON factbooks(company_name);
CREATE INDEX idx_factbooks_category ON factbooks(category);
CREATE INDEX idx_factbooks_created ON factbooks(created_at DESC);

-- Factbook Sections Table
CREATE TABLE factbook_sections (
    id VARCHAR(36) PRIMARY KEY,
    factbook_id VARCHAR(36) NOT NULL REFERENCES factbooks(id) ON DELETE CASCADE,
    section_order INTEGER,
    title VARCHAR(255),
    content TEXT,
    sources JSONB,
    UNIQUE(factbook_id, section_order)
);

CREATE INDEX idx_sections_factbook ON factbook_sections(factbook_id);

-- RFP Uploads Table
CREATE TABLE rfp_uploads (
    id VARCHAR(36) PRIMARY KEY,
    filename VARCHAR(255),
    file_path VARCHAR(500),
    extracted_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
