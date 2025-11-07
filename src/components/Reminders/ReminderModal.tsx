import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

interface PaymentReminder {
  id: string;
  customer_id: string;
  invoice_id: string;
  reminder_date: string;
  message: string;
  status: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  total_amount: number;
  status: string;
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: PaymentReminder | null;
  onSuccess: () => void;
}

export function ReminderModal({ isOpen, onClose, reminder, onSuccess }: ReminderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_id: '',
    reminder_date: '',
    reminder_time: '09:00',
    message: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      if (reminder) {
        const reminderDateTime = new Date(reminder.reminder_date);
        setFormData({
          customer_id: reminder.customer_id,
          invoice_id: reminder.invoice_id,
          reminder_date: reminderDateTime.toISOString().split('T')[0],
          reminder_time: reminderDateTime.toTimeString().slice(0, 5),
          message: reminder.message,
          status: reminder.status,
        });
        loadInvoicesForCustomer(reminder.customer_id);
      } else {
        setFormData({
          customer_id: '',
          invoice_id: '',
          reminder_date: '',
          reminder_time: '09:00',
          message: '',
          status: 'pending',
        });
      }
    }
  }, [isOpen, reminder]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInvoicesForCustomer = async (customerId: string) => {
    if (!customerId) {
      setInvoices([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, total_amount, status')
        .eq('customer_id', customerId)
        .in('status', ['pending', 'overdue'])
        .order('due_date');

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId, invoice_id: '' });
    loadInvoicesForCustomer(customerId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reminderDateTime = new Date(`${formData.reminder_date}T${formData.reminder_time}`);

      if (reminder) {
        const { error } = await supabase
          .from('payment_reminders')
          .update({
            customer_id: formData.customer_id,
            invoice_id: formData.invoice_id,
            reminder_date: reminderDateTime.toISOString(),
            message: formData.message,
            status: formData.status,
          })
          .eq('id', reminder.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_reminders')
          .insert([{
            customer_id: formData.customer_id,
            invoice_id: formData.invoice_id,
            reminder_date: reminderDateTime.toISOString(),
            message: formData.message,
            status: formData.status,
            created_at: new Date().toISOString(),
          }]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-lg p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {reminder ? 'Edit Reminder' : 'Set Payment Reminder'}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer *
                    </label>
                    <select
                      value={formData.customer_id}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice *
                    </label>
                    <select
                      value={formData.invoice_id}
                      onChange={(e) => setFormData({ ...formData, invoice_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={!formData.customer_id}
                    >
                      <option value="">Select Invoice</option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - Rs. {invoice.total_amount.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reminder Date *
                      </label>
                      <input
                        type="date"
                        value={formData.reminder_date}
                        onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={formData.reminder_time}
                        onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reminder Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please follow up on payment for invoice..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (reminder ? 'Update' : 'Create')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}