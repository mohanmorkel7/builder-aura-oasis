-- Banani App Complete Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'sales', 'product')),
    department VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    start_date DATE,
    last_login TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    expected_value DECIMAL(12,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding', 'completed')),
    sales_rep_id INTEGER REFERENCES users(id),
    start_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    lead_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Lead Source Information
    lead_source VARCHAR(50) NOT NULL CHECK (lead_source IN ('email', 'social-media', 'phone', 'website', 'referral', 'cold-call', 'event', 'other')),
    lead_source_value TEXT,
    
    -- Project Information
    project_title VARCHAR(500),
    project_description TEXT,
    project_requirements TEXT,
    
    -- Enhanced Project Information
    solutions JSONB DEFAULT '[]'::jsonb,
    priority_level VARCHAR(20) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
    start_date DATE,
    targeted_end_date DATE,
    expected_daily_txn_volume INTEGER,
    project_value DECIMAL(15,2),
    spoc VARCHAR(255),
    
    -- Commercials
    commercials JSONB DEFAULT '[]'::jsonb,
    commercial_pricing JSONB DEFAULT '[]'::jsonb,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) CHECK (client_type IN ('new', 'existing')),
    company VARCHAR(255),
    company_location VARCHAR(500),
    category VARCHAR(100) CHECK (category IN ('aggregator', 'banks')),
    country VARCHAR(100) CHECK (country IN ('india', 'usa', 'uae', 'uk', 'singapore', 'canada', 'australia', 'other')),
    
    -- Contact Information (JSONB array for multiple contacts)
    contacts JSONB DEFAULT '[]'::jsonb,
    
    -- Additional Information
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'won', 'lost', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expected_close_date DATE,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    notes TEXT,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Steps table
CREATE TABLE IF NOT EXISTS lead_steps (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    step_order INTEGER DEFAULT 1,
    due_date DATE,
    completed_date TIMESTAMP,
    estimated_days INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Chat/Messages table
CREATE TABLE IF NOT EXISTS lead_chats (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES lead_steps(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    is_rich_text BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Documents/Attachments table
CREATE TABLE IF NOT EXISTS lead_documents (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    step_id INTEGER REFERENCES lead_steps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups table (enhanced)
CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    lead_id INTEGER REFERENCES leads(id),
    message_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    follow_up_type VARCHAR(50) DEFAULT 'general' CHECK (follow_up_type IN ('call', 'email', 'meeting', 'document', 'proposal', 'contract', 'onboarding', 'general', 'sales', 'support', 'other')),
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'standard' CHECK (type IN ('standard', 'enterprise', 'smb')),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template steps table
CREATE TABLE IF NOT EXISTS template_steps (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_eta_days INTEGER DEFAULT 3,
    auto_alert BOOLEAN DEFAULT false,
    email_reminder BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client onboarding instances
CREATE TABLE IF NOT EXISTS client_onboarding (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES onboarding_templates(id),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding step instances
CREATE TABLE IF NOT EXISTS onboarding_step_instances (
    id SERIAL PRIMARY KEY,
    onboarding_id INTEGER REFERENCES client_onboarding(id) ON DELETE CASCADE,
    template_step_id INTEGER REFERENCES template_steps(id),
    client_id INTEGER REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    step_order INTEGER DEFAULT 1,
    due_date DATE,
    completed_date TIMESTAMP,
    estimated_days INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding documents
CREATE TABLE IF NOT EXISTS onboarding_documents (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES onboarding_step_instances(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding comments
CREATE TABLE IF NOT EXISTS onboarding_comments (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES onboarding_step_instances(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'note' CHECK (comment_type IN ('note', 'update', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_version VARCHAR(50),
    repository_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL CHECK (environment IN ('development', 'staging', 'qa', 'production')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    auto_rollback BOOLEAN DEFAULT true,
    run_tests BOOLEAN DEFAULT true,
    notify_team BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    release_notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_sales_rep ON clients(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_client_name ON leads(client_name);

CREATE INDEX IF NOT EXISTS idx_lead_steps_lead_id ON lead_steps(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_steps_status ON lead_steps(status);
CREATE INDEX IF NOT EXISTS idx_lead_steps_assigned_to ON lead_steps(assigned_to);

CREATE INDEX IF NOT EXISTS idx_lead_chats_step_id ON lead_chats(step_id);
CREATE INDEX IF NOT EXISTS idx_lead_chats_user_id ON lead_chats(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_step_id ON lead_documents(step_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON follow_ups(assigned_to);

CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON deployments(environment);
CREATE INDEX IF NOT EXISTS idx_deployments_product_id ON deployments(product_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_client ON client_onboarding(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_instances_client_id ON onboarding_step_instances(client_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_instances_status ON onboarding_step_instances(status);
CREATE INDEX IF NOT EXISTS idx_template_steps_template ON template_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Insert default admin user (password: 'password')
INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('John', 'Doe', 'admin@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('Jane', 'Smith', 'sales@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'sales', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (first_name, last_name, email, password_hash, role, status) 
VALUES ('Mike', 'Johnson', 'product@banani.com', '$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y', 'product', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, current_version) VALUES 
('Core App', 'Main application platform', 'v2.0.9'),
('Analytics Module', 'Data analytics and reporting', 'v1.5.1'),
('API Gateway', 'API management and routing', 'v3.0.0'),
('Mobile App', 'Mobile application', 'v1.2.2'),
('Reporting Service', 'Report generation service', 'v0.8.9')
ON CONFLICT DO NOTHING;

-- Insert sample onboarding templates
INSERT INTO onboarding_templates (name, description, type, created_by) VALUES 
('Standard Client Onboarding', 'A comprehensive template for standard client onboarding, covering initial contact to final setup.', 'standard', 1),
('Enterprise Client Onboarding', 'Tailored onboarding process for large enterprise clients with complex integration requirements.', 'enterprise', 1),
('SMB Onboarding Lite', 'A streamlined onboarding template for small to medium businesses with essential steps.', 'smb', 1)
ON CONFLICT DO NOTHING;

-- Insert template steps for standard onboarding
INSERT INTO template_steps (template_id, step_order, name, description, default_eta_days, auto_alert, email_reminder) VALUES 
(1, 1, 'Initial Contact', 'Reach out to the client to introduce the onboarding process.', 2, true, true),
(1, 2, 'Document Collection', 'Gather all necessary legal and financial documents from the client.', 5, true, true),
(1, 3, 'Contract Signing', 'Review and execute service agreements.', 3, true, false),
(1, 4, 'Account Setup', 'Create client accounts and configure initial settings.', 2, false, true),
(1, 5, 'Training Session', 'Conduct onboarding training and knowledge transfer.', 7, false, true)
ON CONFLICT DO NOTHING;

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_steps_updated_at ON lead_steps;
CREATE TRIGGER update_lead_steps_updated_at BEFORE UPDATE ON lead_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_follow_ups_updated_at ON follow_ups;
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_step_instances_updated_at ON onboarding_step_instances;
CREATE TRIGGER update_onboarding_step_instances_updated_at BEFORE UPDATE ON onboarding_step_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_templates_updated_at ON onboarding_templates;
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON onboarding_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
