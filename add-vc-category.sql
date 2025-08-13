-- Add VC category to template_categories table
INSERT INTO template_categories (name, description, color, icon, sort_order, is_active, created_at, updated_at)
VALUES (
    'VC', 
    'Venture Capital templates', 
    '#8B5CF6', 
    'TrendingUp', 
    6, 
    true, 
    NOW(), 
    NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Verify the insertion
SELECT * FROM template_categories WHERE name = 'VC';
