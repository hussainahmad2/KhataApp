-- =====================================================
-- DATABASE SETUP SCRIPT FOR ASAAN KHAATA
-- =====================================================
-- This script will recreate all tables with the correct schema
-- Run this in your Supabase SQL editor to fix the interface issues
-- =====================================================

-- Drop existing tables to recreate with proper ID system
DROP TABLE IF EXISTS payment_reminders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with sequential ID
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  company_name text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table with sequential ID
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  balance numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendors table with sequential ID
CREATE TABLE vendors (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  balance numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory table with sequential ID (name instead of product_name, NO status field)
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category text DEFAULT '',
  quantity integer DEFAULT 0 CHECK (quantity >= 0),
  unit_price numeric DEFAULT 0 CHECK (unit_price >= 0),
  reorder_level integer DEFAULT 10 CHECK (reorder_level >= 0),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table with sequential ID and proper foreign key
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number text UNIQUE NOT NULL,
  customer_id integer REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  amount numeric DEFAULT 0 CHECK (amount >= 0),
  tax_amount numeric DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric DEFAULT 0 CHECK (total_amount >= 0),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table with sequential ID and proper foreign key
CREATE TABLE invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id integer REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id integer REFERENCES inventory(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  amount numeric NOT NULL CHECK (amount >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create payments table with sequential ID and proper foreign keys
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  invoice_id integer REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id integer REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  payment_method text DEFAULT 'cash',
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create payment_reminders table with sequential ID and proper foreign keys
CREATE TABLE payment_reminders (
  id SERIAL PRIMARY KEY,
  customer_id integer REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  invoice_id integer REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_date date NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payment_reminders_customer_id ON payment_reminders(customer_id);
CREATE INDEX idx_payment_reminders_invoice_id ON payment_reminders(invoice_id);

-- Insert sample data for testing
INSERT INTO customers (name, email, phone, address, balance, status) VALUES
('John Doe', 'john@example.com', '+1234567890', '123 Main St, City', 0, 'active'),
('Jane Smith', 'jane@example.com', '+1234567891', '456 Oak Ave, Town', 0, 'active'),
('Bob Johnson', 'bob@example.com', '+1234567892', '789 Pine Rd, Village', 0, 'active');

INSERT INTO vendors (name, email, phone, address, balance, status) VALUES
('ABC Supplies', 'abc@supplies.com', '+1987654321', '123 Supplier St, City', 0, 'active'),
('XYZ Corporation', 'xyz@corp.com', '+1987654322', '456 Vendor Ave, Town', 0, 'active'),
('Quality Goods', 'quality@goods.com', '+1987654323', '987 Merchant Rd, Village', 0, 'active');

INSERT INTO inventory (name, sku, category, quantity, unit_price, reorder_level, description) VALUES
('Laptop', 'LAP001', 'Electronics', 50, 1200, 10, 'High-performance laptop'),
('Mouse', 'MOU001', 'Electronics', 100, 25, 20, 'Wireless gaming mouse'),
('Keyboard', 'KEY001', 'Electronics', 75, 80, 15, 'Mechanical gaming keyboard'),
('Paper', 'PAP001', 'Office', 200, 5, 50, 'A4 paper pack'),
('Pen', 'PEN001', 'Office', 500, 2, 100, 'Pack of 100 pens');

-- Create sample invoices
INSERT INTO invoices (invoice_number, customer_id, amount, tax_amount, total_amount, status, due_date) VALUES
('INV-001', 1, 1000, 150, 1150, 'pending', CURRENT_DATE + INTERVAL '30 days'),
('INV-002', 2, 2500, 375, 2875, 'paid', CURRENT_DATE - INTERVAL '5 days'),
('INV-003', 3, 800, 120, 920, 'draft', CURRENT_DATE + INTERVAL '45 days');

-- Create sample invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, amount) VALUES
(1, 1, 'Laptop', 1, 1000, 1000),
(2, 1, 'Laptop', 2, 1200, 2400),
(2, 2, 'Mouse', 1, 25, 25),
(3, 3, 'Keyboard', 1, 80, 80),
(3, 4, 'Paper', 10, 5, 50),
(3, 5, 'Pen', 20, 2, 40);

-- Create sample payments
INSERT INTO payments (invoice_id, customer_id, amount, payment_date, payment_method, status) VALUES
(2, 2, 2875, CURRENT_DATE - INTERVAL '3 days', 'bank_transfer', 'completed');

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON profiles FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "Enable update for users based on auth_user_id" ON profiles FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Enable delete for users based on auth_user_id" ON profiles FOR DELETE USING (auth.uid() = auth_user_id);

CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON customers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON vendors FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON vendors FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON vendors FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON inventory FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON invoices FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON invoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON invoice_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON invoice_items FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payments FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON payments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON payment_reminders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payment_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payment_reminders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON payment_reminders FOR DELETE USING (true);

-- =====================================================
-- DATABASE SETUP COMPLETE!
-- =====================================================
-- Your database now has the correct schema that matches your components
-- The interface issues should be resolved
-- =====================================================
