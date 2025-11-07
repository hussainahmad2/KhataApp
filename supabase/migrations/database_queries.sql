-- =====================================================
-- COMPREHENSIVE DATABASE QUERIES FOR ASAAN KHAATA
-- =====================================================
-- This file demonstrates all relationships, joins, and data integrity
-- features of the new sequential ID system
-- =====================================================

-- =====================================================
-- 1. CUSTOMER MANAGEMENT QUERIES
-- =====================================================

-- Get all customers with their total outstanding balance
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.balance,
    c.status,
    COUNT(i.id) as total_invoices,
    SUM(CASE WHEN i.status IN ('pending', 'overdue') THEN i.total_amount ELSE 0 END) as outstanding_amount
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.balance, c.status
ORDER BY c.id;

-- Get customers with overdue invoices
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    i.invoice_number,
    i.total_amount,
    i.due_date,
    CURRENT_DATE - i.due_date as days_overdue
FROM customers c
JOIN invoices i ON c.id = i.customer_id
WHERE i.status = 'pending' 
    AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- Get customer payment history
SELECT 
    c.id,
    c.name,
    p.payment_date,
    p.amount,
    p.payment_method,
    p.status,
    i.invoice_number
FROM customers c
JOIN payments p ON c.id = p.customer_id
LEFT JOIN invoices i ON p.invoice_id = i.id
ORDER BY c.id, p.payment_date DESC;

-- =====================================================
-- 2. VENDOR MANAGEMENT QUERIES
-- =====================================================

-- Get all vendors with their balance status
SELECT 
    v.id,
    v.name,
    v.email,
    v.phone,
    v.balance,
    CASE 
        WHEN v.balance > 0 THEN 'We owe vendor'
        WHEN v.balance < 0 THEN 'Vendor owes us'
        ELSE 'Settled'
    END as balance_status,
    v.status
FROM vendors v
ORDER BY v.id;

-- Get vendors by payment status
SELECT 
    v.id,
    v.name,
    v.balance,
    CASE 
        WHEN v.balance > 1000 THEN 'High Payable'
        WHEN v.balance > 100 THEN 'Medium Payable'
        WHEN v.balance > 0 THEN 'Low Payable'
        ELSE 'No Payable'
    END as payment_category
FROM vendors v
WHERE v.status = 'active'
ORDER BY v.balance DESC;

-- =====================================================
-- 3. INVENTORY MANAGEMENT QUERIES
-- =====================================================

-- Get inventory with stock status
SELECT 
    i.id,
    i.name,
    i.sku,
    i.category,
    i.quantity,
    i.unit_price,
    i.quantity * i.unit_price as total_value,
    CASE 
        WHEN i.quantity = 0 THEN 'Out of Stock'
        WHEN i.quantity <= i.reorder_level THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    i.reorder_level
FROM inventory i
ORDER BY i.id;

-- Get low stock items that need reordering
SELECT 
    i.id,
    i.name,
    i.sku,
    i.quantity,
    i.reorder_level,
    i.unit_price,
    (i.reorder_level - i.quantity) as units_to_order
FROM inventory i
WHERE i.quantity <= i.reorder_level 
ORDER BY (i.reorder_level - i.quantity) DESC;

-- Get inventory value by category
SELECT 
    i.category,
    COUNT(*) as item_count,
    SUM(i.quantity) as total_quantity,
    SUM(i.quantity * i.unit_price) as total_value,
    AVG(i.unit_price) as avg_unit_price
FROM inventory i
GROUP BY i.category
ORDER BY total_value DESC;

-- =====================================================
-- 4. INVOICE MANAGEMENT QUERIES
-- =====================================================

-- Get complete invoice details with customer and items
SELECT 
    i.id,
    i.invoice_number,
    c.name as customer_name,
    c.email as customer_email,
    i.amount,
    i.tax_amount,
    i.total_amount,
    i.status,
    i.due_date,
    i.created_at,
    COUNT(ii.id) as item_count,
    SUM(ii.quantity) as total_quantity
FROM invoices i
JOIN customers c ON i.customer_id = c.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_number, c.name, c.email, i.amount, i.tax_amount, i.total_amount, i.status, i.due_date, i.created_at
ORDER BY i.id;

-- Get invoice items with product details
SELECT 
    ii.id,
    i.invoice_number,
    c.name as customer_name,
    ii.product_name,
    ii.quantity,
    ii.unit_price,
    ii.amount,
    inv.sku,
    inv.category
FROM invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN customers c ON i.customer_id = c.id
LEFT JOIN inventory inv ON ii.product_id = inv.id
ORDER BY i.id, ii.id;

-- Get overdue invoices with customer details
SELECT 
    i.id,
    i.invoice_number,
    c.name as customer_name,
    c.phone as customer_phone,
    i.total_amount,
    i.due_date,
    CURRENT_DATE - i.due_date as days_overdue,
    c.balance as customer_balance
FROM invoices i
JOIN customers c ON i.customer_id = c.id
WHERE i.status = 'pending' 
    AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- =====================================================
-- 5. PAYMENT MANAGEMENT QUERIES
-- =====================================================

-- Get payment summary by customer
SELECT 
    c.id,
    c.name,
    COUNT(p.id) as payment_count,
    SUM(p.amount) as total_payments,
    MAX(p.payment_date) as last_payment_date,
    c.balance as current_balance
FROM customers c
LEFT JOIN payments p ON c.id = p.customer_id
GROUP BY c.id, c.name, c.balance
ORDER BY c.id;

-- Get payment methods summary
SELECT 
    p.payment_method,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as avg_amount
FROM payments p
WHERE p.status = 'completed'
GROUP BY p.payment_method
ORDER BY total_amount DESC;

-- Get payments with invoice details
SELECT 
    p.id,
    p.payment_date,
    p.amount,
    p.payment_method,
    p.status,
    c.name as customer_name,
    i.invoice_number,
    i.total_amount as invoice_total
FROM payments p
JOIN customers c ON p.customer_id = c.id
LEFT JOIN invoices i ON p.invoice_id = i.id
ORDER BY p.payment_date DESC;

-- =====================================================
-- 6. FINANCIAL REPORTING QUERIES
-- =====================================================

-- Get monthly revenue summary
SELECT 
    EXTRACT(YEAR FROM p.payment_date) as year,
    EXTRACT(MONTH FROM p.payment_date) as month,
    TO_CHAR(p.payment_date, 'Month YYYY') as month_name,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_revenue
FROM payments p
WHERE p.status = 'completed'
GROUP BY EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date), TO_CHAR(p.payment_date, 'Month YYYY')
ORDER BY year DESC, month DESC;

-- Get customer outstanding balances
SELECT 
    c.id,
    c.name,
    c.email,
    c.balance as current_balance,
    CASE 
        WHEN c.balance > 0 THEN 'Has Outstanding Balance'
        WHEN c.balance < 0 THEN 'Has Credit Balance'
        ELSE 'Settled'
    END as balance_status
FROM customers c
WHERE c.status = 'active'
ORDER BY c.balance DESC;

-- Get inventory value summary
SELECT 
    COUNT(*) as total_items,
    SUM(quantity) as total_quantity,
    SUM(quantity * unit_price) as total_value,
    AVG(unit_price) as avg_unit_price,
    MIN(unit_price) as min_unit_price,
    MAX(unit_price) as max_unit_price
FROM inventory;

-- =====================================================
-- 7. RELATIONSHIP INTEGRITY QUERIES
-- =====================================================

-- Verify foreign key relationships
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count
FROM customers
UNION ALL
SELECT 
    'vendors' as table_name,
    COUNT(*) as record_count
FROM vendors
UNION ALL
SELECT 
    'inventory' as table_name,
    COUNT(*) as record_count
FROM inventory
UNION ALL
SELECT 
    'invoices' as table_name,
    COUNT(*) as record_count
FROM invoices
UNION ALL
SELECT 
    'invoice_items' as table_name,
    COUNT(*) as record_count
FROM invoice_items
UNION ALL
SELECT 
    'payments' as table_name,
    COUNT(*) as record_count
FROM payments
UNION ALL
SELECT 
    'payment_reminders' as table_name,
    COUNT(*) as record_count
FROM payment_reminders;

-- Check for orphaned records
SELECT 
    'invoice_items without invoice' as issue,
    COUNT(*) as count
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE i.id IS NULL
UNION ALL
SELECT 
    'payments without customer' as issue,
    COUNT(*) as count
FROM payments p
LEFT JOIN customers c ON p.customer_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 
    'reminders without customer' as issue,
    COUNT(*) as count
FROM payment_reminders pr
LEFT JOIN customers c ON pr.customer_id = c.id
WHERE c.id IS NULL;

-- =====================================================
-- 8. PERFORMANCE OPTIMIZATION QUERIES
-- =====================================================

-- Check index usage statistics (simplified for Supabase compatibility)
SELECT 
    'Index statistics not available in this environment' as note;

-- Get table sizes (simplified for Supabase compatibility)
SELECT 
    'Table size information not available in this environment' as note;

-- =====================================================
-- 9. DATA VALIDATION QUERIES
-- =====================================================

-- Validate data integrity constraints
SELECT 
    'Negative quantities' as validation,
    COUNT(*) as count
FROM inventory
WHERE quantity < 0
UNION ALL
SELECT 
    'Negative prices' as validation,
    COUNT(*) as count
FROM inventory
WHERE unit_price < 0
UNION ALL
SELECT 
    'Invalid invoice status' as validation,
    COUNT(*) as count
FROM invoices
WHERE status NOT IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')
UNION ALL
SELECT 
    'Invalid customer status' as validation,
    COUNT(*) as count
FROM customers
WHERE status NOT IN ('active', 'inactive', 'pending');

-- =====================================================
-- 10. BUSINESS INTELLIGENCE QUERIES
-- =====================================================

-- Get top customers by revenue
SELECT 
    c.id,
    c.name,
    c.email,
    COUNT(i.id) as invoice_count,
    SUM(i.total_amount) as total_revenue,
    AVG(i.total_amount) as avg_invoice_amount
FROM customers c
JOIN invoices i ON c.id = i.customer_id
WHERE i.status = 'paid'
GROUP BY c.id, c.name, c.email
ORDER BY total_revenue DESC
LIMIT 10;

-- Get product performance
SELECT 
    i.id,
    i.name,
    i.sku,
    i.category,
    i.quantity,
    i.unit_price,
    COUNT(ii.id) as times_sold,
    SUM(ii.quantity) as total_sold,
    SUM(ii.amount) as total_revenue
FROM inventory i
LEFT JOIN invoice_items ii ON i.id = ii.product_id
GROUP BY i.id, i.name, i.sku, i.category, i.quantity, i.unit_price
ORDER BY total_revenue DESC NULLS LAST;

-- Get payment trends
SELECT 
    EXTRACT(DOW FROM payment_date) as day_of_week,
    TO_CHAR(payment_date, 'Day') as day_name,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM payments
WHERE status = 'completed'
GROUP BY EXTRACT(DOW FROM payment_date), TO_CHAR(payment_date, 'Day')
ORDER BY day_of_week;

-- =====================================================
-- END OF COMPREHENSIVE DATABASE QUERIES
-- =====================================================
-- This file demonstrates the complete data model and relationships
-- All queries use the new sequential ID system for optimal performance
-- =====================================================
