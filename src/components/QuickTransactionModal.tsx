import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDate } from '../context/DateContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  status: string;
}

interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  status: string;
}

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickTransactionModal({ isOpen, onClose, onSuccess }: QuickTransactionModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useManualId, setUseManualId] = useState(false);
  const [foundEntity, setFoundEntity] = useState<{ id: number; name: string } | null>(null);
  const { selectedDate } = useDate();

  const [formData, setFormData] = useState({
    entity_type: 'customer' as 'customer' | 'vendor',
    entity_id: '',
    transaction_type: 'debit' as 'debit' | 'credit',
    amount: '',
    description: '',
    reference: '',
    transaction_date: selectedDate || new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      loadEntities();
      // when modal opens, use the global selected date as default
      setFormData(prev => ({ ...prev, transaction_date: selectedDate }));
    }
  }, [isOpen]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const [customersResult, vendorsResult] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('vendors').select('*').order('name')
      ]);

      if (customersResult.error) throw customersResult.error;
      if (vendorsResult.error) throw vendorsResult.error;

      setCustomers(customersResult.data || []);
      setVendors(vendorsResult.data || []);
    } catch (error) {
      console.error('Error loading entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const findEntityById = async (id: string) => {
    if (!id || parseInt(id) <= 0) {
      setFoundEntity(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from(formData.entity_type === 'customer' ? 'customers' : 'vendors')
        .select('id, name')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding entity:', error);
        setFoundEntity(null);
        return;
      }

      if (data) {
        setFoundEntity(data);
      } else {
        setFoundEntity(null);
      }
    } catch (error) {
      console.error('Error finding entity:', error);
      setFoundEntity(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.entity_id || !formData.amount || parseFloat(formData.amount) <= 0 || parseInt(formData.entity_id) <= 0) {
      setError('Please fill in all required fields with valid values. ID and amount must be positive numbers.');
      return;
    }

    try {
      setLoading(true);
      const transactionData = {
        entity_type: formData.entity_type,
        entity_id: parseInt(formData.entity_id),
        transaction_type: formData.transaction_type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference,
        transaction_date: formData.transaction_date
      };

      const { error } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (error) throw error;

      onSuccess();
      onClose();
      setFormData({
        entity_type: 'customer',
        entity_id: '',
        transaction_type: 'debit',
        amount: '',
        description: '',
        reference: '',
        transaction_date: selectedDate || new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      setError('Error saving transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEntityOptions = () => {
    if (formData.entity_type === 'customer') {
      return customers.map(customer => (
        <option key={customer.id} value={customer.id}>
          #{customer.id} - {customer.name}
        </option>
      ));
    } else {
      return vendors.map(vendor => (
        <option key={vendor.id} value={vendor.id}>
          #{vendor.id} - {vendor.name}
        </option>
      ));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quick Transaction Entry</h2>
              <p className="text-sm text-gray-500">Add transaction for any customer or vendor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            {/* Entity Type and Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Entity Type *
                </label>
                <select
                  value={formData.entity_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    entity_type: e.target.value as 'customer' | 'vendor',
                    entity_id: '' // Reset selection when type changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {formData.entity_type === 'customer' ? 'Customer' : 'Vendor'} *
                  </label>
                  <div className="flex items-center space-x-2 text-sm mb-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-purple-600"
                        checked={!useManualId}
                        onChange={() => setUseManualId(false)}
                      />
                      <span className="ml-2">Select from list</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio text-purple-600"
                        checked={useManualId}
                        onChange={() => setUseManualId(true)}
                      />
                      <span className="ml-2">Enter ID manually</span>
                    </label>
                  </div>
                  {useManualId ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={formData.entity_id}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({ ...prev, entity_id: value }));
                            findEntityById(value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder={`Enter ${formData.entity_type} ID`}
                          required
                        />
                      </div>
                      {foundEntity && (
                        <div className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                          <span className="font-medium">#{foundEntity.id}</span> | {foundEntity.name}
                        </div>
                      )}
                      {formData.entity_id && !foundEntity && (
                        <div className="text-sm text-red-600">
                          No {formData.entity_type} found with this ID
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      value={formData.entity_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select {formData.entity_type}</option>
                      {getEntityOptions()}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Type and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Transaction Type *
                </label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as 'debit' | 'credit' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="debit">
                    Debit ({formData.entity_type === 'customer' ? 'Customer owes money' : 'Money paid to vendor'})
                  </option>
                  <option value="credit">
                    Credit ({formData.entity_type === 'customer' ? 'Customer pays money' : 'Money received from vendor'})
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Description and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Transaction description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Invoice/Receipt number"
                />
              </div>
            </div>

            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Transaction
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
