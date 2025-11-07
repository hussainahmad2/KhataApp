/*
  # Final Opening Balance Removal
  
  This migration completely removes all opening balance references and ensures
  all balances are calculated purely from transactions.
*/

-- Drop opening_balance columns if they exist
ALTER TABLE customers DROP COLUMN IF EXISTS opening_balance;
ALTER TABLE vendors DROP COLUMN IF EXISTS opening_balance;

-- Update balance calculation functions to work without opening balance
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

-- Clear all existing data and reset balances to 0
UPDATE customers SET balance = 0;
UPDATE vendors SET balance = 0;

-- Recalculate all balances based on transactions
DO $$
DECLARE
    customer_record RECORD;
    vendor_record RECORD;
BEGIN
    -- Update all customer balances
    FOR customer_record IN SELECT id FROM customers LOOP
        PERFORM calculate_customer_balance(customer_record.id);
    END LOOP;
    
    -- Update all vendor balances
    FOR vendor_record IN SELECT id FROM vendors LOOP
        PERFORM calculate_vendor_balance(vendor_record.id);
    END LOOP;
END $$;

-- Add fresh demo data without opening balance
DELETE FROM payment_reminders;
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM transactions;
DELETE FROM inventory;
DELETE FROM vendors;
DELETE FROM customers;

-- Insert fresh demo data
INSERT INTO customers (name, email, phone, address, balance, status) VALUES
('John Doe', 'john@example.com', '+1234567890', '123 Main St, City', 0, 'active'),
('Jane Smith', 'jane@example.com', '+1234567891', '456 Oak Ave, Town', 0, 'active'),
('Bob Johnson', 'bob@example.com', '+1234567892', '789 Pine Rd, Village', 0, 'active'),
('Alice Brown', 'alice@example.com', '+1234567893', '321 Elm St, City', 0, 'active'),
('Charlie Wilson', 'charlie@example.com', '+1234567894', '654 Maple Ave, Town', 0, 'active'),
('Hammad Ul Hassan', 'hammad@example.com', '+1234567895', '789 Oak Street, City', 0, 'active');

INSERT INTO vendors (name, email, phone, address, balance, status) VALUES
('ABC Supplies', 'abc@supplies.com', '+1987654321', '321 Vendor St, City', 0, 'active'),
('XYZ Corp', 'xyz@corp.com', '+1987654322', '654 Supplier Ave, Town', 0, 'active'),
('Quality Goods', 'quality@goods.com', '+1987654323', '987 Merchant Rd, Village', 0, 'active'),
('Tech Solutions', 'tech@solutions.com', '+1987654324', '147 Tech Blvd, City', 0, 'active'),
('Office Depot', 'office@depot.com', '+1987654325', '258 Office St, Town', 0, 'active');

INSERT INTO inventory (name, sku, category, quantity, unit_price, reorder_level, description) VALUES
('Laptop', 'LAP001', 'Electronics', 50, 1200, 10, 'High-performance laptop'),
('Mouse', 'MOU001', 'Electronics', 100, 25, 20, 'Wireless gaming mouse'),
('Keyboard', 'KEY001', 'Electronics', 75, 80, 15, 'Mechanical gaming keyboard'),
('Monitor', 'MON001', 'Electronics', 30, 300, 5, '24-inch LED monitor'),
('Paper', 'PAP001', 'Office', 200, 5, 50, 'A4 paper pack'),
('Pen', 'PEN001', 'Office', 500, 2, 100, 'Pack of 100 pens'),
('Notebook', 'NOTE001', 'Office', 150, 15, 25, 'Spiral bound notebook'),
('Stapler', 'STAP001', 'Office', 40, 12, 10, 'Heavy duty stapler');

-- Create sample invoices
INSERT INTO invoices (invoice_number, customer_id, amount, tax_amount, total_amount, status, due_date) VALUES
('INV-2024001', 1, 1000, 170, 1170, 'pending', CURRENT_DATE + INTERVAL '30 days'),
('INV-2024002', 2, 2500, 425, 2925, 'pending', CURRENT_DATE + INTERVAL '45 days'),
('INV-2024003', 3, 800, 136, 936, 'paid', CURRENT_DATE - INTERVAL '10 days'),
('INV-2024004', 4, 1500, 255, 1755, 'pending', CURRENT_DATE + INTERVAL '15 days'),
('INV-2024005', 5, 600, 102, 702, 'draft', CURRENT_DATE + INTERVAL '60 days'),
('INV-2024006', 6, 2000, 340, 2340, 'pending', CURRENT_DATE + INTERVAL '30 days');

-- Create sample invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, amount) VALUES
(1, 1, 'Laptop', 1, 1000, 1000),
(2, 1, 'Laptop', 2, 1200, 2400),
(2, 2, 'Mouse', 2, 25, 50),
(3, 4, 'Paper', 160, 5, 800),
(4, 3, 'Keyboard', 1, 80, 80),
(4, 4, 'Monitor', 1, 300, 300),
(4, 5, 'Paper', 200, 5, 1000),
(5, 6, 'Pen', 300, 2, 600),
(6, 1, 'Laptop', 1, 2000, 2000);

-- Create sample payments
INSERT INTO payments (invoice_id, customer_id, amount, payment_date, payment_method, status) VALUES
(3, 3, 936, CURRENT_DATE - INTERVAL '10 days', 'bank_transfer', 'completed'),
(1, 1, 500, CURRENT_DATE - INTERVAL '5 days', 'cash', 'completed');

-- Create sample transactions to demonstrate balance calculations
INSERT INTO transactions (entity_type, entity_id, transaction_type, amount, description, reference, transaction_date) VALUES
-- Customer 1 transactions
('customer', 1, 'debit', 1000, 'Invoice INV-2024001', 'INV-2024001', CURRENT_DATE - INTERVAL '5 days'),
('customer', 1, 'credit', 500, 'Payment received', 'PAY-001', CURRENT_DATE - INTERVAL '3 days'),
-- Customer 2 transactions
('customer', 2, 'debit', 2500, 'Invoice INV-2024002', 'INV-2024002', CURRENT_DATE - INTERVAL '10 days'),
-- Customer 3 transactions
('customer', 3, 'debit', 800, 'Invoice INV-2024003', 'INV-2024003', CURRENT_DATE - INTERVAL '15 days'),
('customer', 3, 'credit', 936, 'Payment received', 'PAY-002', CURRENT_DATE - INTERVAL '10 days'),
-- Customer 4 transactions
('customer', 4, 'debit', 1500, 'Invoice INV-2024004', 'INV-2024004', CURRENT_DATE - INTERVAL '2 days'),
-- Customer 5 transactions
('customer', 5, 'debit', 600, 'Invoice INV-2024005', 'INV-2024005', CURRENT_DATE - INTERVAL '1 day'),
-- Customer 6 (Hammad) transactions - this will show the balance
('customer', 6, 'debit', 2000, 'Invoice INV-2024006', 'INV-2024006', CURRENT_DATE - INTERVAL '3 days'),
('customer', 6, 'debit', 1000, 'Additional services', 'SVC-001', CURRENT_DATE - INTERVAL '2 days'),
('customer', 6, 'credit', 500, 'Payment received', 'PAY-003', CURRENT_DATE - INTERVAL '1 day'),
-- Vendor 1 transactions
('vendor', 1, 'credit', 2000, 'Purchase from ABC Supplies', 'PUR-001', CURRENT_DATE - INTERVAL '20 days'),
('vendor', 1, 'debit', 1500, 'Payment to ABC Supplies', 'PAY-V001', CURRENT_DATE - INTERVAL '15 days'),
-- Vendor 2 transactions
('vendor', 2, 'credit', 3000, 'Purchase from XYZ Corp', 'PUR-002', CURRENT_DATE - INTERVAL '25 days'),
('vendor', 2, 'debit', 2000, 'Payment to XYZ Corp', 'PAY-V002', CURRENT_DATE - INTERVAL '20 days'),
-- Vendor 3 transactions
('vendor', 3, 'credit', 1000, 'Purchase from Quality Goods', 'PUR-003', CURRENT_DATE - INTERVAL '12 days'),
('vendor', 3, 'debit', 800, 'Payment to Quality Goods', 'PAY-V003', CURRENT_DATE - INTERVAL '8 days');

-- Create sample payment reminders
INSERT INTO payment_reminders (customer_id, invoice_id, reminder_date, message, status) VALUES
(1, 1, CURRENT_DATE + INTERVAL '25 days', 'Payment due in 5 days', 'pending'),
(2, 2, CURRENT_DATE + INTERVAL '40 days', 'Payment due in 5 days', 'pending'),
(4, 4, CURRENT_DATE + INTERVAL '10 days', 'Payment due in 5 days', 'pending'),
(6, 6, CURRENT_DATE + INTERVAL '25 days', 'Payment due in 5 days', 'pending');

-- Update all customer and vendor balances using the new calculation functions
DO $$
DECLARE
    customer_record RECORD;
    vendor_record RECORD;
BEGIN
    -- Update all customer balances
    FOR customer_record IN SELECT id FROM customers LOOP
        PERFORM calculate_customer_balance(customer_record.id);
    END LOOP;
    
    -- Update all vendor balances
    FOR vendor_record IN SELECT id FROM vendors LOOP
        PERFORM calculate_vendor_balance(vendor_record.id);
    END LOOP;
END $$;
