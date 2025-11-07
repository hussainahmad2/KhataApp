/*
  # Final Setup with User Support
  
  This migration ensures all tables have proper user_id support and removes any remaining
  opening balance references. It also adds some sample transactions for testing.
*/

-- Ensure all tables have user_id column
DO $$
BEGIN
    -- Add user_id to customers if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to vendors if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'user_id') THEN
        ALTER TABLE vendors ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to inventory if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'user_id') THEN
        ALTER TABLE inventory ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to invoices if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
        ALTER TABLE invoices ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to payments if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'user_id') THEN
        ALTER TABLE payments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to payment_reminders if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_reminders' AND column_name = 'user_id') THEN
        ALTER TABLE payment_reminders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add user_id to transactions if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
        ALTER TABLE transactions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for user_id columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Update RLS policies to include user_id filtering
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;
CREATE POLICY "Users can manage own customers"
  ON customers FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
CREATE POLICY "Users can manage own vendors"
  ON vendors FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory;
CREATE POLICY "Users can manage own inventory"
  ON inventory FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;
CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own invoice items" ON invoice_items;
CREATE POLICY "Users can manage own invoice items"
  ON invoice_items FOR ALL TO authenticated
  USING (auth.uid() = (SELECT user_id FROM invoices WHERE id = invoice_id));

DROP POLICY IF EXISTS "Users can manage own payments" ON payments;
CREATE POLICY "Users can manage own payments"
  ON payments FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own payment reminders" ON payment_reminders;
CREATE POLICY "Users can manage own payment reminders"
  ON payment_reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Update existing data to have a default user (for demo purposes)
-- This will only run if there are records without user_id
DO $$
DECLARE
    default_user_id uuid;
BEGIN
    -- Get the first user from auth.users
    SELECT id INTO default_user_id FROM auth.users LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        -- Update all tables with the default user_id
        UPDATE customers SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE vendors SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE inventory SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE invoices SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE payments SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE payment_reminders SET user_id = default_user_id WHERE user_id IS NULL;
        UPDATE transactions SET user_id = default_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL after setting default values
ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_reminders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;

-- Add some sample transactions for testing (only if no transactions exist)
INSERT INTO transactions (entity_type, entity_id, transaction_type, amount, description, reference, transaction_date, user_id)
SELECT 
    'customer' as entity_type,
    1 as entity_id,
    'debit' as transaction_type,
    1000 as amount,
    'Sample Invoice Payment' as description,
    'INV-001' as reference,
    CURRENT_DATE - INTERVAL '5 days' as transaction_date,
    (SELECT id FROM auth.users LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM transactions LIMIT 1);

INSERT INTO transactions (entity_type, entity_id, transaction_type, amount, description, reference, transaction_date, user_id)
SELECT 
    'customer' as entity_type,
    1 as entity_id,
    'credit' as transaction_type,
    500 as amount,
    'Payment Received' as description,
    'PAY-001' as reference,
    CURRENT_DATE - INTERVAL '3 days' as transaction_date,
    (SELECT id FROM auth.users LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM transactions LIMIT 1);

INSERT INTO transactions (entity_type, entity_id, transaction_type, amount, description, reference, transaction_date, user_id)
SELECT 
    'vendor' as entity_type,
    1 as entity_id,
    'credit' as transaction_type,
    2000 as amount,
    'Purchase from Vendor' as description,
    'PUR-001' as reference,
    CURRENT_DATE - INTERVAL '10 days' as transaction_date,
    (SELECT id FROM auth.users LIMIT 1) as user_id
WHERE NOT EXISTS (SELECT 1 FROM transactions LIMIT 1);

-- Update balances for all customers and vendors
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
