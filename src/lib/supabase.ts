import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number;
          auth_user_id: string;
          email: string;
          full_name: string;
          company_name: string;
          phone: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          auth_user_id: string;
          email: string;
          full_name?: string;
          company_name?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          auth_user_id?: string;
          email?: string;
          full_name?: string;
          company_name?: string;
          phone?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: number;
          name: string;
          email: string;
          phone: string;
          address: string;
          balance: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          email?: string;
          phone?: string;
          address?: string;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      vendors: {
        Row: {
          id: number;
          name: string;
          email: string;
          phone: string;
          address: string;
          balance: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          email?: string;
          phone?: string;
          address?: string;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: number;
          name: string;
          sku: string;
          category: string;
          quantity: number;
          unit_price: number;
          reorder_level: number;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          sku: string;
          category?: string;
          quantity?: number;
          unit_price?: number;
          reorder_level?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          sku?: string;
          category?: string;
          quantity?: number;
          unit_price?: number;
          reorder_level?: number;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: number;
          invoice_number: string;
          customer_id: number;
          amount: number;
          tax_amount: number;
          total_amount: number;
          status: string;
          due_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          invoice_number: string;
          customer_id: number;
          amount: number;
          tax_amount?: number;
          total_amount: number;
          status?: string;
          due_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          invoice_number?: string;
          customer_id?: number;
          amount?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: string;
          due_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: number;
          invoice_id: number;
          product_id: number | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          invoice_id: number;
          product_id?: number | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          invoice_id?: number;
          product_id?: number | null;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: number;
          invoice_id: number | null;
          customer_id: number;
          amount: number;
          payment_date: string;
          payment_method: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          invoice_id?: number | null;
          customer_id: number;
          amount: number;
          payment_date: string;
          payment_method: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          invoice_id?: number | null;
          customer_id?: number;
          amount?: number;
          payment_date?: string;
          payment_method?: string;
          status?: string;
          created_at?: string;
        };
      };
      payment_reminders: {
        Row: {
          id: number;
          customer_id: number;
          invoice_id: number;
          reminder_date: string;
          message: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          customer_id: number;
          invoice_id: number;
          reminder_date: string;
          message: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          customer_id?: number;
          invoice_id?: number;
          reminder_date?: string;
          message?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
};