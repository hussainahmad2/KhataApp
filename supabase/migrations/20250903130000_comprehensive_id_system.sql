/*
  # Comprehensive ID System Implementation
  
  This migration implements:
  1. Sequential ID system for all entities
  2. Proper foreign key relationships
  3. Data integrity constraints
  4. Indexes for performance
  5. Proper cascading rules
*/

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
CREATE TABLE IF NOT EXISTS customers (
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
CREATE TABLE IF NOT EXISTS vendors (
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

-- Create inventory table with sequential ID
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
  invoice_id integer REFERENCES invoices(id) ON DELETE SET NULL,
  customer_id integer REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'credit_card', 'online')),
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create payment_reminders table with sequential ID and proper foreign keys
CREATE TABLE payment_reminders (
  id SERIAL PRIMARY KEY,
  customer_id integer REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  invoice_id integer REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  reminder_date timestamptz NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table for customer and vendor transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'vendor')),
  entity_id integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  reference text DEFAULT '',
  transaction_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage vendors"
  ON vendors FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage inventory"
  ON inventory FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage invoices"
  ON invoices FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage invoice items"
  ON invoice_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage payment reminders"
  ON payment_reminders FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON transactions;
CREATE POLICY "Authenticated users can manage transactions"
  ON transactions FOR ALL TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_status ON vendors(status);

CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_inventory_category ON inventory(category);

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);

CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE INDEX idx_payment_reminders_customer_id ON payment_reminders(customer_id);
CREATE INDEX idx_payment_reminders_invoice_id ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_date ON payment_reminders(reminder_date);
CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_entity_type ON transactions(entity_type);
CREATE INDEX IF NOT EXISTS idx_transactions_entity_id ON transactions(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_entity_type_id ON transactions(entity_type, entity_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Insert sample data for testing
INSERT INTO customers (name, email, phone, address, balance, status) VALUES
('John Doe', 'john@example.com', '+1234567890', '123 Main St, City', 0, 'active'),
('Jane Smith', 'jane@example.com', '+1234567891', '456 Oak Ave, Town', 0, 'active'),
('Bob Johnson', 'bob@example.com', '+1234567892', '789 Pine Rd, Village', 0, 'active');

INSERT INTO vendors (name, email, phone, address, balance, status) VALUES
('ABC Supplies', 'abc@supplies.com', '+1987654321', '321 Vendor St, City', 0, 'active'),
('XYZ Corp', 'xyz@corp.com', '+1987654322', '654 Supplier Ave, Town', 0, 'active'),
('Quality Goods', 'quality@goods.com', '+1987654323', '987 Merchant Rd, Village', 0, 'active');

INSERT INTO inventory (name, sku, category, quantity, unit_price, reorder_level, description) VALUES
('Laptop', 'LAP001', 'Electronics', 50, 1200, 10, 'High-performance laptop'),
('Mouse', 'MOU001', 'Electronics', 100, 25, 20, 'Wireless gaming mouse'),
('Keyboard', 'KEY001', 'Electronics', 75, 80, 15, 'Mechanical gaming keyboard'),
('Paper', 'PAP001', 'Office', 200, 5, 50, 'A4 paper pack'),
('Pen', 'PEN001', 'Office', 500, 2, 100, 'Pack of 100 pens');

-- Create sample invoices
INSERT INTO invoices (invoice_number, customer_id, amount, tax_amount, total_amount, status, due_date) VALUES
('INV-2024001', 1, 1000, 170, 1170, 'pending', CURRENT_DATE + INTERVAL '30 days'),
('INV-2024002', 2, 2500, 425, 2925, 'pending', CURRENT_DATE + INTERVAL '45 days'),
('INV-2024003', 3, 800, 136, 936, 'paid', CURRENT_DATE - INTERVAL '10 days');

-- Create sample invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, amount) VALUES
(1, 1, 'Laptop', 1, 1000, 1000),
(2, 1, 'Laptop', 2, 1200, 2400),
(2, 2, 'Mouse', 2, 25, 50),
(3, 4, 'Paper', 160, 5, 800);

-- Create sample payments
INSERT INTO payments (invoice_id, customer_id, amount, payment_date, payment_method, status) VALUES
(3, 3, 936, CURRENT_DATE - INTERVAL '10 days', 'bank_transfer', 'completed');

-- Create sample payment reminders
INSERT INTO payment_reminders (customer_id, invoice_id, reminder_date, message, status) VALUES
(1, 1, CURRENT_DATE + INTERVAL '25 days', 'Payment due in 5 days', 'pending'),
(2, 2, CURRENT_DATE + INTERVAL '40 days', 'Payment due in 5 days', 'pending');

-- Create functions for balance calculations
CREATE OR REPLACE FUNCTION calculate_customer_balance(customer_id_param integer)
RETURNS numeric AS $$
DECLARE
  total_debits numeric;
  total_credits numeric;
  final_balance numeric;
BEGIN
  -- Get total debits (money owed by customer)
  SELECT COALESCE(SUM(amount), 0) INTO total_debits
  FROM transactions 
  WHERE entity_type = 'customer' 
    AND entity_id = customer_id_param 
    AND transaction_type = 'debit';
  
  -- Get total credits (money paid by customer)
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM transactions 
  WHERE entity_type = 'customer' 
    AND entity_id = customer_id_param 
    AND transaction_type = 'credit';
  
  -- Calculate final balance: debit - credit = balance
  -- For customers: positive balance means customer owes us money
  final_balance := total_debits - total_credits;
  
  -- Update customer balance
  UPDATE customers SET balance = final_balance WHERE id = customer_id_param;
  
  RETURN final_balance;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_vendor_balance(vendor_id_param integer)
RETURNS numeric AS $$
DECLARE
  total_debits numeric;
  total_credits numeric;
  final_balance numeric;
BEGIN
  -- Get total debits (money paid to vendor)
  SELECT COALESCE(SUM(amount), 0) INTO total_debits
  FROM transactions 
  WHERE entity_type = 'vendor' 
    AND entity_id = vendor_id_param 
    AND transaction_type = 'debit';
  
  -- Get total credits (money received from vendor)
  SELECT COALESCE(SUM(amount), 0) INTO total_credits
  FROM transactions 
  WHERE entity_type = 'vendor' 
    AND entity_id = vendor_id_param 
    AND transaction_type = 'credit';
  
  -- Calculate final balance: credit - debit = balance
  -- For vendors: positive balance means we owe vendor money
  final_balance := total_credits - total_debits;
  
  -- Update vendor balance
  UPDATE vendors SET balance = final_balance WHERE id = vendor_id_param;
  
  RETURN final_balance;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance when transactions change
CREATE OR REPLACE FUNCTION update_balance_on_transaction()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF TG_OP = 'DELETE' THEN
      -- For delete, use OLD values
      IF OLD.entity_type = 'customer' THEN
        PERFORM calculate_customer_balance(OLD.entity_id);
      ELSIF OLD.entity_type = 'vendor' THEN
        PERFORM calculate_vendor_balance(OLD.entity_id);
      END IF;
    ELSE
      -- For insert/update, use NEW values
      IF NEW.entity_type = 'customer' THEN
        PERFORM calculate_customer_balance(NEW.entity_id);
      ELSIF NEW.entity_type = 'vendor' THEN
        PERFORM calculate_vendor_balance(NEW.entity_id);
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_update_balance_on_transaction ON transactions;
CREATE TRIGGER trigger_update_balance_on_transaction
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE PROCEDURE update_balance_on_transaction();
