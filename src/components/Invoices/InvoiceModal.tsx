import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDate } from '../../context/DateContext';

interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
}

interface InventoryItem {
  id: number;
  name: string;
  unit_price: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  onSuccess: () => void;
}

export function InvoiceModal({ isOpen, onClose, invoice, onSuccess }: InvoiceModalProps) {
  const { selectedDate } = useDate();
  const [formData, setFormData] = useState<Partial<Invoice>>({
    id: 0,
    invoice_number: '',
    customer_id: 0,
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft',
    due_date: selectedDate
  });
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingIds, setExistingIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadInventoryItems();
      loadExistingIds();
    }
  }, [isOpen]);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      loadInvoiceItems();
    } else {
      setFormData({
        id: 0,
        invoice_number: '',
        customer_id: 0,
        amount: 0,
        tax_amount: 0,
        total_amount: 0,
        status: 'draft',
        due_date: selectedDate
      });
      setItems([]);
    }
  }, [invoice]);

  const loadExistingIds = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setExistingIds(data?.map(i => i.id) || []);
    } catch (error) {
      console.error('Error loading existing IDs:', error);
    }
  };

  const getNextAvailableId = () => {
    if (existingIds.length === 0) return 1;
    return Math.max(...existingIds) + 1;
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, unit_price')
        .order('name');
      
      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error loading inventory items:', error);
    }
  };

  const loadInvoiceItems = async () => {
    if (!invoice) return;
    
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);
      
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const handleInputChange = (field: keyof Invoice, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: 0,
      invoice_id: 0,
      product_id: null,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      amount: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = inventoryItems.find(p => p.id === productId);
    if (product) {
      updateItem(index, 'product_id', product.id);
      updateItem(index, 'product_name', product.name);
      updateItem(index, 'unit_price', product.unit_price);
      updateItem(index, 'amount', product.unit_price); // Set initial amount to unit price
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;
    
    setFormData(prev => ({
      ...prev,
      amount: subtotal,
      tax_amount: tax,
      total_amount: total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const validateForm = () => {
    if (!formData.invoice_number?.trim()) {
      setError('Invoice number is required');
      return false;
    }
    if (!formData.customer_id) {
      setError('Customer is required');
      return false;
    }
    if (items.length === 0) {
      setError('At least one item is required');
      return false;
    }
    if (formData.id && existingIds.includes(formData.id) && (!invoice || invoice.id !== formData.id)) {
      setError('This ID is already assigned to another invoice');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (invoice) {
        // Update existing invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update(formData)
          .eq('id', invoice.id);

        if (invoiceError) throw invoiceError;

        // Delete existing items
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([formData])
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        formData.id = newInvoice.id;
      }

      // Insert/update invoice items
      const itemsToInsert = items.map(item => ({
        ...item,
        invoice_id: formData.id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice ID *
              </label>
              <input
                type="number"
                value={formData.id || ''}
                onChange={(e) => handleInputChange('id', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter unique ID"
                min="1"
              />
              {!invoice && (
                <button
                  type="button"
                  onClick={() => handleInputChange('id', getNextAvailableId())}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Use next available ID: {getNextAvailableId()}
                </button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Each ID can only be assigned to one invoice
              </p>
            </div>

            {/* Invoice Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                value={formData.invoice_number || ''}
                onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., INV-001"
              />
            </div>

            {/* Customer Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customer_id || ''}
                onChange={(e) => handleInputChange('customer_id', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status || 'draft'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Invoice Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-200 rounded-lg">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => handleProductSelect(index, parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select product</option>
                        {inventoryItems.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - Rs. {product.unit_price}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={item.product_name || ''}
                        onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Product name"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          const price = item.unit_price || 0;
                          updateItem(index, 'quantity', qty);
                          updateItem(index, 'amount', qty * price);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          const qty = item.quantity || 0;
                          updateItem(index, 'unit_price', price);
                          updateItem(index, 'amount', qty * price);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-end space-x-8">
              <div className="text-right">
                <div className="text-sm text-gray-600">Subtotal:</div>
                <div className="text-lg font-semibold">Rs. {formData.amount?.toLocaleString() || '0'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Tax (15%):</div>
                <div className="text-lg font-semibold">Rs. {formData.tax_amount?.toLocaleString() || '0'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total:</div>
                <div className="text-2xl font-bold text-blue-600">Rs. {formData.total_amount?.toLocaleString() || '0'}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}