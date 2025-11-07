import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  quantity: number;
  reorder_level: number;
  description: string;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
  onSuccess: () => void;
}

export function InventoryModal({ isOpen, onClose, item, onSuccess }: InventoryModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    id: 0,
    name: '',
    sku: '',
    category: '',
    unit_price: 0,
    quantity: 0,
    reorder_level: 10,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingIds, setExistingIds] = useState<number[]>([]);

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: 0,
        name: '',
        sku: '',
        category: '',
        unit_price: 0,
        quantity: 0,
        reorder_level: 10,
        description: ''
      });
    }
    loadExistingIds();
  }, [item]);

  const loadExistingIds = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
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

  const handleInputChange = (field: keyof InventoryItem, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.sku?.trim()) {
      setError('SKU is required');
      return false;
    }
    if (formData.id && existingIds.includes(formData.id) && (!item || item.id !== formData.id)) {
      setError('This ID is already assigned to another product');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (item) {
        // Update existing item
        const { error } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory')
          .insert([formData]);

        if (error) throw error;
      }

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
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {item ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID *
            </label>
            <input
              type="number"
              value={formData.id || ''}
              onChange={(e) => handleInputChange('id', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter unique ID"
              min="1"
            />
            {!item && (
              <button
                type="button"
                onClick={() => handleInputChange('id', getNextAvailableId())}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Use next available ID: {getNextAvailableId()}
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Each ID can only be assigned to one product
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product name"
            />
          </div>

          {/* SKU Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku || ''}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SKU code"
            />
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category"
            />
          </div>

          {/* Unit Price Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.unit_price || ''}
              onChange={(e) => handleInputChange('unit_price', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              min="0"
            />
          </div>

          {/* Quantity Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Quantity
            </label>
            <input
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Reorder Level Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level
            </label>
            <input
              type="number"
              value={formData.reorder_level || ''}
              onChange={(e) => handleInputChange('reorder_level', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alert when quantity falls below this level
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (item ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}