import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PlusIcon, BellIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ReminderModal } from '../components/Reminders/ReminderModal';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface PaymentReminder {
  id: string;
  customer_id: string;
  invoice_id: string;
  reminder_date: string;
  message: string;
  status: string;
  created_at: string;
  customers?: {
    name: string;
    email: string;
  };
  invoices?: {
    invoice_number: string;
    total_amount: number;
    due_date: string;
  };
}

export function PaymentReminders() {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<PaymentReminder | null>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_reminders')
        .select(`
          *,
          customers (name, email),
          invoices (invoice_number, total_amount, due_date)
        `)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = () => {
    setSelectedReminder(null);
    setIsModalOpen(true);
  };

  const handleEditReminder = (reminder: PaymentReminder) => {
    setSelectedReminder(reminder);
    setIsModalOpen(true);
  };

  const markAsCompleted = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
      await loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReminderPriority = (reminderDate: string) => {
    const today = new Date();
    const reminder = new Date(reminderDate);
    
    if (isBefore(reminder, today)) return 'overdue';
    if (isBefore(reminder, addDays(today, 3))) return 'urgent';
    if (isBefore(reminder, addDays(today, 7))) return 'upcoming';
    return 'future';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue':
        return 'bg-red-500';
      case 'urgent':
        return 'bg-orange-500';
      case 'upcoming':
        return 'bg-yellow-500';
      case 'future':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const urgentReminders = reminders.filter(r => 
    ['overdue', 'urgent'].includes(getReminderPriority(r.reminder_date)) && r.status === 'pending'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Reminders</h1>
        <button
          onClick={handleAddReminder}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Set Reminder</span>
        </button>
      </div>

      {/* Urgent Alerts */}
      {urgentReminders.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800">
              Urgent Reminders ({urgentReminders.length})
            </h3>
          </div>
          <div className="mt-2 space-y-2">
            {urgentReminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="text-sm text-red-700">
                <strong>{reminder.customers?.name}</strong> - {reminder.invoices?.invoice_number} 
                (Rs. {reminder.invoices?.total_amount.toLocaleString()}) - Due: {format(new Date(reminder.reminder_date), 'MMM dd')}
              </div>
            ))}
            {urgentReminders.length > 3 && (
              <div className="text-sm text-red-600 font-medium">
                and {urgentReminders.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminder Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reminders.map((reminder) => {
                const priority = getReminderPriority(reminder.reminder_date);
                return (
                  <tr key={reminder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`}></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reminder.customers?.name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {reminder.invoices?.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      Rs. {reminder.invoices?.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(reminder.reminder_date), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {reminder.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reminder.status)}`}>
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {reminder.status === 'pending' && (
                          <button
                            onClick={() => markAsCompleted(reminder.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Mark as completed"
                          >
                            <ClockIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditReminder(reminder)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reminder={selectedReminder}
        onSuccess={loadReminders}
      />
    </div>
  );
}