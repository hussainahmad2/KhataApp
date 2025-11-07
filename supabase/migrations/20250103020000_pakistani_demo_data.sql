/*
  # Pakistani Demo Data
  
  This migration adds comprehensive demo data with 10 Pakistani customers and 10 vendors
  along with realistic transactions to demonstrate the application functionality.
*/

-- Clear existing data first (in correct order to respect foreign keys)
DELETE FROM payment_reminders;
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM transactions;
DELETE FROM inventory;
DELETE FROM vendors;
DELETE FROM customers;

-- Reset sequences to start from 1
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE vendors_id_seq RESTART WITH 1;
ALTER SEQUENCE inventory_id_seq RESTART WITH 1;
ALTER SEQUENCE invoices_id_seq RESTART WITH 1;
ALTER SEQUENCE invoice_items_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_reminders_id_seq RESTART WITH 1;

-- Insert 10 Pakistani customers first
INSERT INTO customers (name, email, phone, address, balance, status) VALUES
('Ahmed Ali Khan', 'ahmed.ali@email.com', '+92-300-1234567', 'Gulberg, Lahore, Punjab', 0, 'active'),
('Fatima Sheikh', 'fatima.sheikh@email.com', '+92-301-2345678', 'Defence Phase 2, Karachi, Sindh', 0, 'active'),
('Muhammad Hassan', 'm.hassan@email.com', '+92-302-3456789', 'F-8, Islamabad, Federal', 0, 'active'),
('Ayesha Malik', 'ayesha.malik@email.com', '+92-303-4567890', 'Cantt, Rawalpindi, Punjab', 0, 'active'),
('Usman Qureshi', 'usman.qureshi@email.com', '+92-304-5678901', 'Model Town, Lahore, Punjab', 0, 'active'),
('Sara Ahmad', 'sara.ahmad@email.com', '+92-305-6789012', 'Clifton, Karachi, Sindh', 0, 'active'),
('Bilal Raza', 'bilal.raza@email.com', '+92-306-7890123', 'DHA Phase 5, Lahore, Punjab', 0, 'active'),
('Zainab Khan', 'zainab.khan@email.com', '+92-307-8901234', 'G-9, Islamabad, Federal', 0, 'active'),
('Tariq Mahmood', 'tariq.mahmood@email.com', '+92-308-9012345', 'Bahria Town, Rawalpindi, Punjab', 0, 'active'),
('Hina Aslam', 'hina.aslam@email.com', '+92-309-0123456', 'Gulshan-e-Iqbal, Karachi, Sindh', 0, 'active');

-- Insert 10 Pakistani vendors/suppliers
INSERT INTO vendors (name, email, phone, address, balance, status) VALUES
('Lahore Textile Mills', 'info@lahoretextile.com', '+92-42-1234567', 'Industrial Area, Lahore, Punjab', 0, 'active'),
('Karachi Electronics Co.', 'sales@karachielec.com', '+92-21-2345678', 'Korangi Industrial Area, Karachi, Sindh', 0, 'active'),
('Islamabad Stationery Supply', 'orders@isbstationery.com', '+92-51-3456789', 'Blue Area, Islamabad, Federal', 0, 'active'),
('Rawalpindi Hardware Store', 'contact@rwp-hardware.com', '+92-51-4567890', 'Commercial Market, Rawalpindi, Punjab', 0, 'active'),
('Punjab Paper Works', 'info@punjabpaper.com', '+92-42-5678901', 'Ferozepur Road, Lahore, Punjab', 0, 'active'),
('Sindh Office Solutions', 'sales@sindhoffice.com', '+92-21-6789012', 'Gulshan-e-Iqbal, Karachi, Sindh', 0, 'active'),
('Federal IT Services', 'support@federalit.com', '+92-51-7890123', 'F-10, Islamabad, Federal', 0, 'active'),
('Lahore Furniture House', 'orders@lahorefurniture.com', '+92-42-8901234', 'Liberty Market, Lahore, Punjab', 0, 'active'),
('Karachi Printing Press', 'print@karachipress.com', '+92-21-9012345', 'North Nazimabad, Karachi, Sindh', 0, 'active'),
('Islamabad Construction Materials', 'materials@isbconstruction.com', '+92-51-0123456', 'I-9 Industrial Area, Islamabad, Federal', 0, 'active');

-- Insert inventory items
INSERT INTO inventory (name, sku, category, quantity, unit_price, reorder_level, description) VALUES
('A4 Paper (500 sheets)', 'PAP-A4-500', 'Stationery', 200, 250, 50, 'High quality A4 paper pack'),
('Blue Ink Pen', 'PEN-BLUE-001', 'Stationery', 500, 15, 100, 'Ball point pen - blue ink'),
('Spiral Notebook', 'NOTE-SPIRAL-001', 'Stationery', 150, 80, 25, '200 page spiral bound notebook'),
('Office Chair', 'CHAIR-OFFICE-001', 'Furniture', 25, 15000, 5, 'Ergonomic office chair'),
('Desk Lamp', 'LAMP-DESK-001', 'Electronics', 40, 2500, 10, 'LED desk lamp with adjustable brightness'),
('File Cabinet', 'CABINET-FILE-001', 'Furniture', 15, 8000, 3, '2-drawer metal file cabinet'),
('Calculator', 'CALC-BASIC-001', 'Electronics', 60, 800, 15, 'Basic scientific calculator'),
('Stapler', 'STAPLER-001', 'Stationery', 30, 450, 8, 'Heavy duty stapler'),
('Whiteboard', 'BOARD-WHITE-001', 'Office Equipment', 12, 3500, 3, 'Magnetic whiteboard 4x3 feet'),
('Printer Paper (Ream)', 'PAPER-REAM-001', 'Stationery', 100, 400, 20, '500 sheets printer paper');

-- Create sample invoices for customers (after customers are inserted)
INSERT INTO invoices (invoice_number, customer_id, amount, tax_amount, total_amount, status, due_date) VALUES
('INV-2024-001', 1, 5000, 850, 5850, 'pending', CURRENT_DATE + INTERVAL '30 days'),
('INV-2024-002', 2, 12000, 2040, 14040, 'pending', CURRENT_DATE + INTERVAL '45 days'),
('INV-2024-003', 3, 3500, 595, 4095, 'paid', CURRENT_DATE - INTERVAL '5 days'),
('INV-2024-004', 4, 8000, 1360, 9360, 'pending', CURRENT_DATE + INTERVAL '15 days'),
('INV-2024-005', 5, 2500, 425, 2925, 'draft', CURRENT_DATE + INTERVAL '60 days'),
('INV-2024-006', 6, 15000, 2550, 17550, 'pending', CURRENT_DATE + INTERVAL '30 days'),
('INV-2024-007', 7, 6000, 1020, 7020, 'pending', CURRENT_DATE + INTERVAL '20 days'),
('INV-2024-008', 8, 4000, 680, 4680, 'paid', CURRENT_DATE - INTERVAL '10 days'),
('INV-2024-009', 9, 9000, 1530, 10530, 'pending', CURRENT_DATE + INTERVAL '25 days'),
('INV-2024-010', 10, 7000, 1190, 8190, 'pending', CURRENT_DATE + INTERVAL '35 days');

-- Create invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, unit_price, amount) VALUES
-- Invoice 1 items
(1, 1, 'A4 Paper (500 sheets)', 10, 250, 2500),
(1, 2, 'Blue Ink Pen', 50, 15, 750),
(1, 3, 'Spiral Notebook', 20, 80, 1600),
(1, 8, 'Stapler', 2, 450, 900),
-- Invoice 2 items
(2, 4, 'Office Chair', 2, 15000, 30000),
(2, 5, 'Desk Lamp', 4, 2500, 10000),
(2, 6, 'File Cabinet', 1, 8000, 8000),
-- Invoice 3 items
(3, 1, 'A4 Paper (500 sheets)', 5, 250, 1250),
(3, 2, 'Blue Ink Pen', 30, 15, 450),
(3, 3, 'Spiral Notebook', 10, 80, 800),
(3, 7, 'Calculator', 2, 800, 1600),
-- Invoice 4 items
(4, 4, 'Office Chair', 1, 15000, 15000),
(4, 5, 'Desk Lamp', 2, 2500, 5000),
(4, 9, 'Whiteboard', 1, 3500, 3500),
-- Invoice 5 items
(5, 1, 'A4 Paper (500 sheets)', 3, 250, 750),
(5, 2, 'Blue Ink Pen', 20, 15, 300),
(5, 3, 'Spiral Notebook', 5, 80, 400),
-- Invoice 6 items
(6, 4, 'Office Chair', 3, 15000, 45000),
(6, 6, 'File Cabinet', 2, 8000, 16000),
(6, 9, 'Whiteboard', 2, 3500, 7000),
-- Invoice 7 items
(7, 5, 'Desk Lamp', 3, 2500, 7500),
(7, 7, 'Calculator', 5, 800, 4000),
(7, 8, 'Stapler', 3, 450, 1350),
-- Invoice 8 items
(8, 1, 'A4 Paper (500 sheets)', 8, 250, 2000),
(8, 2, 'Blue Ink Pen', 40, 15, 600),
(8, 3, 'Spiral Notebook', 15, 80, 1200),
-- Invoice 9 items
(9, 4, 'Office Chair', 2, 15000, 30000),
(9, 5, 'Desk Lamp', 2, 2500, 5000),
(9, 6, 'File Cabinet', 1, 8000, 8000),
-- Invoice 10 items
(10, 1, 'A4 Paper (500 sheets)', 6, 250, 1500),
(10, 2, 'Blue Ink Pen', 35, 15, 525),
(10, 3, 'Spiral Notebook', 12, 80, 960),
(10, 7, 'Calculator', 3, 800, 2400);

-- Create sample payments
INSERT INTO payments (invoice_id, customer_id, amount, payment_date, payment_method, status) VALUES
(3, 3, 4095, CURRENT_DATE - INTERVAL '5 days', 'bank_transfer', 'completed'),
(8, 8, 4680, CURRENT_DATE - INTERVAL '10 days', 'cash', 'completed'),
(1, 1, 2000, CURRENT_DATE - INTERVAL '3 days', 'bank_transfer', 'completed'),
(4, 4, 5000, CURRENT_DATE - INTERVAL '2 days', 'cash', 'completed');

-- Create comprehensive transactions for customers (DEBIT = money owed by customer, CREDIT = money paid by customer)
INSERT INTO transactions (entity_type, entity_id, transaction_type, amount, description, reference, transaction_date) VALUES
-- Customer 1 (Ahmed Ali Khan) transactions
('customer', 1, 'debit', 5000, 'Invoice INV-2024-001 - Office Supplies', 'INV-2024-001', CURRENT_DATE - INTERVAL '10 days'),
('customer', 1, 'credit', 2000, 'Partial Payment Received', 'PAY-001', CURRENT_DATE - INTERVAL '3 days'),
('customer', 1, 'debit', 2500, 'Additional Services - Consultation', 'SVC-001', CURRENT_DATE - INTERVAL '5 days'),
('customer', 1, 'debit', 1500, 'Express Delivery Charges', 'DEL-001', CURRENT_DATE - INTERVAL '2 days'),
('customer', 1, 'credit', 1000, 'Advance Payment', 'PAY-002', CURRENT_DATE - INTERVAL '1 day'),

-- Customer 2 (Fatima Sheikh) transactions
('customer', 2, 'debit', 12000, 'Invoice INV-2024-002 - Office Furniture', 'INV-2024-002', CURRENT_DATE - INTERVAL '15 days'),
('customer', 2, 'debit', 3000, 'Express Delivery Charges', 'DEL-002', CURRENT_DATE - INTERVAL '12 days'),
('customer', 2, 'debit', 2000, 'Installation Services', 'INST-001', CURRENT_DATE - INTERVAL '10 days'),
('customer', 2, 'credit', 5000, 'Milestone Payment', 'PAY-003', CURRENT_DATE - INTERVAL '8 days'),
('customer', 2, 'debit', 1800, 'Custom Design Work', 'DESIGN-001', CURRENT_DATE - INTERVAL '5 days'),

-- Customer 3 (Muhammad Hassan) transactions
('customer', 3, 'debit', 3500, 'Invoice INV-2024-003 - Stationery Items', 'INV-2024-003', CURRENT_DATE - INTERVAL '8 days'),
('customer', 3, 'credit', 4095, 'Full Payment Received', 'PAY-004', CURRENT_DATE - INTERVAL '5 days'),
('customer', 3, 'debit', 1500, 'Additional Order - Notebooks', 'ADD-001', CURRENT_DATE - INTERVAL '2 days'),
('customer', 3, 'debit', 800, 'Rush Order Charges', 'RUSH-001', CURRENT_DATE - INTERVAL '1 day'),
('customer', 3, 'credit', 1000, 'Partial Payment', 'PAY-005', CURRENT_DATE),

-- Customer 4 (Ayesha Malik) transactions
('customer', 4, 'debit', 8000, 'Invoice INV-2024-004 - Office Setup', 'INV-2024-004', CURRENT_DATE - INTERVAL '12 days'),
('customer', 4, 'credit', 5000, 'Partial Payment Received', 'PAY-006', CURRENT_DATE - INTERVAL '2 days'),
('customer', 4, 'debit', 1200, 'Installation Services', 'INST-002', CURRENT_DATE - INTERVAL '1 day'),
('customer', 4, 'debit', 2000, 'Additional Equipment', 'ADD-002', CURRENT_DATE - INTERVAL '3 days'),
('customer', 4, 'credit', 1500, 'Advance Payment', 'PAY-007', CURRENT_DATE - INTERVAL '5 days'),

-- Customer 5 (Usman Qureshi) transactions
('customer', 5, 'debit', 2500, 'Invoice INV-2024-005 - Basic Supplies', 'INV-2024-005', CURRENT_DATE - INTERVAL '3 days'),
('customer', 5, 'debit', 800, 'Rush Order Charges', 'RUSH-002', CURRENT_DATE - INTERVAL '1 day'),
('customer', 5, 'debit', 1200, 'Special Packaging', 'PACK-001', CURRENT_DATE - INTERVAL '2 days'),
('customer', 5, 'credit', 2000, 'Advance Payment', 'PAY-008', CURRENT_DATE - INTERVAL '4 days'),

-- Customer 6 (Sara Ahmad) transactions
('customer', 6, 'debit', 15000, 'Invoice INV-2024-006 - Complete Office Setup', 'INV-2024-006', CURRENT_DATE - INTERVAL '20 days'),
('customer', 6, 'debit', 5000, 'Custom Furniture Design', 'CUST-001', CURRENT_DATE - INTERVAL '18 days'),
('customer', 6, 'credit', 8000, 'Advance Payment Received', 'PAY-009', CURRENT_DATE - INTERVAL '15 days'),
('customer', 6, 'debit', 3000, 'Premium Installation', 'INST-003', CURRENT_DATE - INTERVAL '12 days'),
('customer', 6, 'credit', 5000, 'Milestone Payment', 'PAY-010', CURRENT_DATE - INTERVAL '8 days'),

-- Customer 7 (Bilal Raza) transactions
('customer', 7, 'debit', 6000, 'Invoice INV-2024-007 - Electronics & Supplies', 'INV-2024-007', CURRENT_DATE - INTERVAL '7 days'),
('customer', 7, 'debit', 1500, 'Technical Support Services', 'TECH-001', CURRENT_DATE - INTERVAL '5 days'),
('customer', 7, 'debit', 2000, 'Software Licenses', 'SOFT-001', CURRENT_DATE - INTERVAL '3 days'),
('customer', 7, 'credit', 3000, 'Partial Payment', 'PAY-011', CURRENT_DATE - INTERVAL '2 days'),

-- Customer 8 (Zainab Khan) transactions
('customer', 8, 'debit', 4000, 'Invoice INV-2024-008 - Stationery Package', 'INV-2024-008', CURRENT_DATE - INTERVAL '12 days'),
('customer', 8, 'credit', 4680, 'Full Payment Received', 'PAY-012', CURRENT_DATE - INTERVAL '10 days'),
('customer', 8, 'debit', 2000, 'Monthly Subscription Service', 'SUB-001', CURRENT_DATE - INTERVAL '1 day'),
('customer', 8, 'debit', 1500, 'Additional Services', 'SVC-002', CURRENT_DATE - INTERVAL '3 days'),
('customer', 8, 'credit', 1000, 'Advance Payment', 'PAY-013', CURRENT_DATE - INTERVAL '5 days'),

-- Customer 9 (Tariq Mahmood) transactions
('customer', 9, 'debit', 9000, 'Invoice INV-2024-009 - Office Renovation', 'INV-2024-009', CURRENT_DATE - INTERVAL '18 days'),
('customer', 9, 'debit', 2500, 'Design Consultation', 'DESIGN-002', CURRENT_DATE - INTERVAL '16 days'),
('customer', 9, 'credit', 5000, 'Milestone Payment', 'PAY-014', CURRENT_DATE - INTERVAL '10 days'),
('customer', 9, 'debit', 1800, 'Material Upgrade', 'UPGRADE-001', CURRENT_DATE - INTERVAL '8 days'),
('customer', 9, 'credit', 3000, 'Progress Payment', 'PAY-015', CURRENT_DATE - INTERVAL '5 days'),

-- Customer 10 (Hina Aslam) transactions
('customer', 10, 'debit', 7000, 'Invoice INV-2024-010 - Mixed Supplies', 'INV-2024-010', CURRENT_DATE - INTERVAL '14 days'),
('customer', 10, 'debit', 1800, 'Special Packaging', 'PACK-002', CURRENT_DATE - INTERVAL '12 days'),
('customer', 10, 'credit', 3000, 'Partial Payment', 'PAY-016', CURRENT_DATE - INTERVAL '8 days'),
('customer', 10, 'debit', 2200, 'Express Delivery', 'DEL-003', CURRENT_DATE - INTERVAL '6 days'),
('customer', 10, 'credit', 2000, 'Advance Payment', 'PAY-017', CURRENT_DATE - INTERVAL '4 days'),

-- Vendor transactions (CREDIT = money we owe vendor, DEBIT = money we paid to vendor)
-- Vendor 1 (Lahore Textile Mills) transactions
('vendor', 1, 'credit', 25000, 'Purchase - Textile Materials', 'PUR-001', CURRENT_DATE - INTERVAL '25 days'),
('vendor', 1, 'debit', 20000, 'Payment to Lahore Textile Mills', 'PAY-V001', CURRENT_DATE - INTERVAL '20 days'),
('vendor', 1, 'credit', 15000, 'Additional Order - Cotton Fabric', 'PUR-002', CURRENT_DATE - INTERVAL '15 days'),
('vendor', 1, 'credit', 8000, 'Bulk Cotton Order', 'PUR-003', CURRENT_DATE - INTERVAL '10 days'),
('vendor', 1, 'debit', 12000, 'Partial Payment', 'PAY-V002', CURRENT_DATE - INTERVAL '8 days'),

-- Vendor 2 (Karachi Electronics Co.) transactions
('vendor', 2, 'credit', 30000, 'Purchase - Electronic Equipment', 'PUR-004', CURRENT_DATE - INTERVAL '30 days'),
('vendor', 2, 'debit', 25000, 'Payment to Karachi Electronics', 'PAY-V003', CURRENT_DATE - INTERVAL '25 days'),
('vendor', 2, 'credit', 12000, 'Computer Accessories Order', 'PUR-005', CURRENT_DATE - INTERVAL '10 days'),
('vendor', 2, 'credit', 15000, 'Laptop Purchase', 'PUR-006', CURRENT_DATE - INTERVAL '5 days'),
('vendor', 2, 'debit', 18000, 'Milestone Payment', 'PAY-V004', CURRENT_DATE - INTERVAL '3 days'),

-- Vendor 3 (Islamabad Stationery Supply) transactions
('vendor', 3, 'credit', 8000, 'Purchase - Office Stationery', 'PUR-007', CURRENT_DATE - INTERVAL '20 days'),
('vendor', 3, 'debit', 6000, 'Payment to Islamabad Stationery', 'PAY-V005', CURRENT_DATE - INTERVAL '15 days'),
('vendor', 3, 'credit', 5000, 'Monthly Stationery Supply', 'PUR-008', CURRENT_DATE - INTERVAL '5 days'),
('vendor', 3, 'credit', 3000, 'Bulk Paper Order', 'PUR-009', CURRENT_DATE - INTERVAL '2 days'),
('vendor', 3, 'debit', 4000, 'Partial Payment', 'PAY-V006', CURRENT_DATE - INTERVAL '1 day'),

-- Vendor 4 (Rawalpindi Hardware Store) transactions
('vendor', 4, 'credit', 15000, 'Purchase - Hardware Items', 'PUR-010', CURRENT_DATE - INTERVAL '22 days'),
('vendor', 4, 'debit', 10000, 'Payment to Rawalpindi Hardware', 'PAY-V007', CURRENT_DATE - INTERVAL '18 days'),
('vendor', 4, 'credit', 8000, 'Tools and Equipment', 'PUR-011', CURRENT_DATE - INTERVAL '8 days'),
('vendor', 4, 'credit', 5000, 'Construction Materials', 'PUR-012', CURRENT_DATE - INTERVAL '3 days'),
('vendor', 4, 'debit', 7000, 'Progress Payment', 'PAY-V008', CURRENT_DATE - INTERVAL '1 day'),

-- Vendor 5 (Punjab Paper Works) transactions
('vendor', 5, 'credit', 12000, 'Purchase - Paper Products', 'PUR-013', CURRENT_DATE - INTERVAL '28 days'),
('vendor', 5, 'debit', 10000, 'Payment to Punjab Paper Works', 'PAY-V009', CURRENT_DATE - INTERVAL '23 days'),
('vendor', 5, 'credit', 6000, 'Bulk Paper Order', 'PUR-014', CURRENT_DATE - INTERVAL '12 days'),
('vendor', 5, 'credit', 4000, 'Special Paper Stock', 'PUR-015', CURRENT_DATE - INTERVAL '5 days'),
('vendor', 5, 'debit', 5000, 'Advance Payment', 'PAY-V010', CURRENT_DATE - INTERVAL '2 days'),

-- Vendor 6 (Sindh Office Solutions) transactions
('vendor', 6, 'credit', 18000, 'Purchase - Office Solutions', 'PUR-016', CURRENT_DATE - INTERVAL '26 days'),
('vendor', 6, 'debit', 15000, 'Payment to Sindh Office Solutions', 'PAY-V011', CURRENT_DATE - INTERVAL '21 days'),
('vendor', 6, 'credit', 9000, 'Office Equipment Order', 'PUR-017', CURRENT_DATE - INTERVAL '6 days'),
('vendor', 6, 'credit', 6000, 'Furniture Supply', 'PUR-018', CURRENT_DATE - INTERVAL '3 days'),
('vendor', 6, 'debit', 8000, 'Milestone Payment', 'PAY-V012', CURRENT_DATE - INTERVAL '1 day'),

-- Vendor 7 (Federal IT Services) transactions
('vendor', 7, 'credit', 22000, 'Purchase - IT Services', 'PUR-019', CURRENT_DATE - INTERVAL '24 days'),
('vendor', 7, 'debit', 18000, 'Payment to Federal IT Services', 'PAY-V013', CURRENT_DATE - INTERVAL '19 days'),
('vendor', 7, 'credit', 11000, 'Software Licenses', 'PUR-020', CURRENT_DATE - INTERVAL '7 days'),
('vendor', 7, 'credit', 8000, 'Technical Support', 'PUR-021', CURRENT_DATE - INTERVAL '4 days'),
('vendor', 7, 'debit', 12000, 'Service Payment', 'PAY-V014', CURRENT_DATE - INTERVAL '2 days'),

-- Vendor 8 (Lahore Furniture House) transactions
('vendor', 8, 'credit', 35000, 'Purchase - Office Furniture', 'PUR-022', CURRENT_DATE - INTERVAL '32 days'),
('vendor', 8, 'debit', 30000, 'Payment to Lahore Furniture House', 'PAY-V015', CURRENT_DATE - INTERVAL '27 days'),
('vendor', 8, 'credit', 20000, 'Custom Furniture Order', 'PUR-023', CURRENT_DATE - INTERVAL '14 days'),
('vendor', 8, 'credit', 12000, 'Additional Furniture', 'PUR-024', CURRENT_DATE - INTERVAL '8 days'),
('vendor', 8, 'debit', 15000, 'Progress Payment', 'PAY-V016', CURRENT_DATE - INTERVAL '5 days'),

-- Vendor 9 (Karachi Printing Press) transactions
('vendor', 9, 'credit', 10000, 'Purchase - Printing Services', 'PUR-025', CURRENT_DATE - INTERVAL '18 days'),
('vendor', 9, 'debit', 8000, 'Payment to Karachi Printing Press', 'PAY-V017', CURRENT_DATE - INTERVAL '13 days'),
('vendor', 9, 'credit', 7000, 'Business Cards and Letterheads', 'PUR-026', CURRENT_DATE - INTERVAL '4 days'),
('vendor', 9, 'credit', 5000, 'Marketing Materials', 'PUR-027', CURRENT_DATE - INTERVAL '2 days'),
('vendor', 9, 'debit', 6000, 'Service Payment', 'PAY-V018', CURRENT_DATE - INTERVAL '1 day'),

-- Vendor 10 (Islamabad Construction Materials) transactions
('vendor', 10, 'credit', 28000, 'Purchase - Construction Materials', 'PUR-028', CURRENT_DATE - INTERVAL '29 days'),
('vendor', 10, 'debit', 25000, 'Payment to Islamabad Construction', 'PAY-V019', CURRENT_DATE - INTERVAL '24 days'),
('vendor', 10, 'credit', 15000, 'Renovation Materials', 'PUR-029', CURRENT_DATE - INTERVAL '11 days'),
('vendor', 10, 'credit', 10000, 'Building Supplies', 'PUR-030', CURRENT_DATE - INTERVAL '6 days'),
('vendor', 10, 'debit', 12000, 'Material Payment', 'PAY-V020', CURRENT_DATE - INTERVAL '3 days');

-- Create payment reminders
INSERT INTO payment_reminders (customer_id, invoice_id, reminder_date, message, status) VALUES
(1, 1, CURRENT_DATE + INTERVAL '25 days', 'Payment due in 5 days for Invoice INV-2024-001', 'pending'),
(2, 2, CURRENT_DATE + INTERVAL '40 days', 'Payment due in 5 days for Invoice INV-2024-002', 'pending'),
(4, 4, CURRENT_DATE + INTERVAL '10 days', 'Payment due in 5 days for Invoice INV-2024-004', 'pending'),
(6, 6, CURRENT_DATE + INTERVAL '25 days', 'Payment due in 5 days for Invoice INV-2024-006', 'pending'),
(7, 7, CURRENT_DATE + INTERVAL '15 days', 'Payment due in 5 days for Invoice INV-2024-007', 'pending'),
(9, 9, CURRENT_DATE + INTERVAL '20 days', 'Payment due in 5 days for Invoice INV-2024-009', 'pending'),
(10, 10, CURRENT_DATE + INTERVAL '30 days', 'Payment due in 5 days for Invoice INV-2024-010', 'pending');

-- Update all customer and vendor balances using the calculation functions
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