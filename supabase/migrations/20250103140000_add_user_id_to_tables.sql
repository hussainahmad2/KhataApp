/*
  # Add User ID to Tables for Multi-User Support
  
  This migration adds user_id field to all tables to support multi-user functionality
  and ensures proper data isolation between users.
*/

-- Add user_id column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to payment_reminders table
ALTER TABLE payment_reminders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id columns for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_user_id ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Update RLS policies to include user_id filtering
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Users can manage own customers"
  ON customers FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage vendors" ON vendors;
CREATE POLICY "Users can manage own vendors"
  ON vendors FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage inventory" ON inventory;
CREATE POLICY "Users can manage own inventory"
  ON inventory FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage invoice items" ON invoice_items;
CREATE POLICY "Users can manage own invoice items"
  ON invoice_items FOR ALL TO authenticated
  USING (auth.uid() = (SELECT user_id FROM invoices WHERE id = invoice_id));

DROP POLICY IF EXISTS "Authenticated users can manage payments" ON payments;
CREATE POLICY "Users can manage own payments"
  ON payments FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage payment reminders" ON payment_reminders;
CREATE POLICY "Users can manage own payment reminders"
  ON payment_reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON transactions;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Update existing data to have a default user (for demo purposes)
-- In production, you would need to assign proper user_ids
UPDATE customers SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE vendors SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE inventory SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE invoices SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE payments SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE payment_reminders SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE transactions SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting default values
ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE vendors ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE invoices ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_reminders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
