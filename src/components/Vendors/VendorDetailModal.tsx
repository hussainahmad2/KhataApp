import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useDate } from '../../context/DateContext';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  status: string;
}

interface Transaction {
  id: number;
  entity_type: string;
  entity_id: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference: string;
  transaction_date: string;
  created_at: string;
}

interface VendorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onSuccess: () => void;
}

export function VendorDetailModal({ isOpen, onClose, vendor, onSuccess }: VendorDetailModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { selectedDate } = useDate();
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'debit' as 'debit' | 'credit',
    amount: 0,
    description: '',
    reference: '',
    transaction_date: selectedDate
  });

  useEffect(() => {
    if (isOpen && vendor) {
      loadTransactions();
      // Reset date range when modal opens
      setDateRange({ startDate: '', endDate: '' });
    }
  }, [isOpen, vendor]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, dateRange]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('entity_type', 'vendor')
        .eq('entity_id', vendor.id)
  .order('transaction_date', { ascending: true })
  .order('created_at', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transaction_date);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    setFilteredTransactions(filtered);
  };

  const calculateBalanceBreakdown = () => {
    const totalDebits = filteredTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalCredits = filteredTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Vendor formula: credit - debit = balance
    // For vendors: positive balance means we owe vendor money
    const calculatedBalance = totalCredits - totalDebits;

    return {
      totalDebits,
      totalCredits,
      calculatedBalance,
      currentBalance: calculatedBalance // Use calculated balance instead of stored balance
    };
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setTransactionForm({
      transaction_type: 'debit',
      amount: 0,
      description: '',
      reference: '',
      transaction_date: selectedDate
    });
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      transaction_type: transaction.transaction_type as 'debit' | 'credit',
      amount: transaction.amount,
      description: transaction.description,
      reference: transaction.reference,
      transaction_date: transaction.transaction_date
    });
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDelete.id);

      if (error) throw error;
      
      await loadTransactions();
      onSuccess(); // Refresh vendor list to update balance
      showSuccessMessage('Transaction deleted successfully!');
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.amount || transactionForm.amount <= 0) return;

    try {
      const transactionData = {
        entity_type: 'vendor',
        entity_id: vendor.id,
        transaction_type: transactionForm.transaction_type,
        amount: transactionForm.amount,
        description: transactionForm.description,
        reference: transactionForm.reference,
        transaction_date: transactionForm.transaction_date
      };

      console.log('Submitting transaction with date:', transactionForm.transaction_date);

      if (selectedTransaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', selectedTransaction.id);

        if (error) throw error;
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('transactions')
          .insert([transactionData]);

        if (error) throw error;
      }

      // Only close modal for new transactions, keep open for edits
      if (!selectedTransaction) {
        setShowTransactionModal(false);
      }
      
      await loadTransactions();
      onSuccess(); // Refresh vendor list to update balance
      
      // If updating a transaction, ensure it stays visible by adjusting date range if needed
      if (selectedTransaction) {
        const updatedDate = new Date(transactionForm.transaction_date);
        const currentStart = new Date(dateRange.startDate);
        const currentEnd = new Date(dateRange.endDate);
        
        // If the updated date is outside the current range, expand the range
        if (updatedDate < currentStart || updatedDate > currentEnd) {
          const newStartDate = updatedDate < currentStart ? updatedDate : currentStart;
          const newEndDate = updatedDate > currentEnd ? updatedDate : currentEnd;
          
          setDateRange({
            startDate: newStartDate.toISOString().split('T')[0],
            endDate: newEndDate.toISOString().split('T')[0]
          });
        }
      }
      
      // Show success message
      if (selectedTransaction) {
        showSuccessMessage('Transaction updated successfully!');
      } else {
        showSuccessMessage('Transaction added successfully!');
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
    }
  };

  const exportToCSV = () => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Calculate running balance for each transaction
    const transactionsWithBalance = filteredTransactions.map((transaction, index) => {
      const runningBalance = filteredTransactions
        .slice(0, index + 1)
        .reduce((sum, t) => {
          return sum + (t.transaction_type === 'credit' ? t.amount : -t.amount);
        }, 0);
      return { ...transaction, runningBalance };
    });

    // Create CSV content with separate CREDIT and DEBIT columns to match table structure
    const headers = ['DATE', 'DESCRIPTION', 'CREDIT', 'DEBIT', 'CURRENT BALANCE', 'REFERENCE'];
    const csvContent = [
      headers.join(','),
      ...transactionsWithBalance.map(transaction => {
        const formattedDate = formatDate(transaction.transaction_date);
        const description = transaction.description || '';
        const reference = transaction.reference || '';
        const currentBalance = transaction.runningBalance;
        
        // Separate credit and debit amounts
        const creditAmount = transaction.transaction_type === 'credit' ? transaction.amount : 0;
        const debitAmount = transaction.transaction_type === 'debit' ? transaction.amount : 0;
        
        return [
          `"${formattedDate}"`,
          `"${description}"`,
          creditAmount,
          debitAmount,
          currentBalance,
          `"${reference}"`
        ].join(',');
      })
    ].join('\n');

    const totalDebits = filteredTransactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = filteredTransactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const finalBalance = totalCredits - totalDebits;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transaction Report - ${vendor.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .debit { color: #dc2626; font-weight: bold; }
          .credit { color: #16a34a; font-weight: bold; }
          .amount { text-align: right; }
          .balance { text-align: right; font-weight: bold; }
          .balance-positive { color: #dc2626; }
          .balance-negative { color: #16a34a; }
          .balance-zero { color: #6b7280; }
        </style>
      </head>
      <body>
        <h2>Transaction Report - ${vendor.name}</h2>
        <p><strong>Vendor ID:</strong> #${vendor.id}</p>
        <p><strong>Period:</strong> ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>DESCRIPTION</th>
              <th>CREDIT</th>
              <th>DEBIT</th>
              <th>CURRENT BALANCE</th>
              <th>REFERENCE</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsWithBalance.map(transaction => {
              const formattedDate = formatDate(transaction.transaction_date);
              const description = transaction.description || '';
              const reference = transaction.reference || '';
              const currentBalance = transaction.runningBalance;
              
              const balanceClass = currentBalance > 0 ? 'balance-positive' : 
                                 currentBalance < 0 ? 'balance-negative' : 'balance-zero';
              
              // Separate credit and debit amounts
              const creditAmount = transaction.transaction_type === 'credit' ? transaction.amount : 0;
              const debitAmount = transaction.transaction_type === 'debit' ? transaction.amount : 0;
              
              return `
                <tr>
                  <td>${formattedDate}</td>
                  <td>${description}</td>
                  <td class="amount ${transaction.transaction_type === 'credit' ? 'credit' : ''}">${creditAmount > 0 ? `Rs. ${creditAmount.toLocaleString()}` : '-'}</td>
                  <td class="amount ${transaction.transaction_type === 'debit' ? 'debit' : ''}">${debitAmount > 0 ? `Rs. ${debitAmount.toLocaleString()}` : '-'}</td>
                  <td class="balance ${balanceClass}">Rs. ${currentBalance.toLocaleString()}</td>
                  <td>${reference}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 10px; background-color: #f9fafb; border-radius: 5px;">
          <h3>Summary</h3>
          <p><strong>Total Transactions:</strong> ${filteredTransactions.length}</p>
          <p><strong>Total Debits:</strong> <span class="debit">Rs. ${totalDebits.toLocaleString()}</span></p>
          <p><strong>Total Credits:</strong> <span class="credit">Rs. ${totalCredits.toLocaleString()}</span></p>
          <p><strong>Final Balance:</strong> <span class="${finalBalance > 0 ? 'balance-positive' : finalBalance < 0 ? 'balance-negative' : 'balance-zero'}">Rs. ${finalBalance.toLocaleString()}</span></p>
        </div>
      </body>
      </html>
    `;

    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    
    const csvLink = document.createElement('a');
    const csvUrl = URL.createObjectURL(csvBlob);
    csvLink.setAttribute('href', csvUrl);
    csvLink.setAttribute('download', `vendor_${vendor.id}_transactions_${dateRange.startDate || 'all'}_to_${dateRange.endDate || 'all'}.csv`);
    csvLink.style.visibility = 'hidden';
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    
    const htmlLink = document.createElement('a');
    const htmlUrl = URL.createObjectURL(htmlBlob);
    htmlLink.setAttribute('href', htmlUrl);
    htmlLink.setAttribute('download', `vendor_${vendor.id}_transactions_${dateRange.startDate || 'all'}_to_${dateRange.endDate || 'all'}.html`);
    htmlLink.style.visibility = 'hidden';
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
  };

  const balanceBreakdown = calculateBalanceBreakdown();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Vendor Details: {vendor.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          {/* Vendor Information - Simplified */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">#{vendor.id} - {vendor.name}</h3>
                {vendor.email && <p className="text-sm text-gray-600">{vendor.email}</p>}
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className={`text-2xl font-bold ${
                  vendor.balance > 0 ? 'text-red-600' : vendor.balance < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  Rs. {vendor.balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Transactions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    const endDate = selectedDate;
                    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setDateRange({ startDate, endDate });
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Balance Summary (Filtered Period)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total Debits:</span> 
                <div className="font-mono text-lg text-red-600">+Rs. {balanceBreakdown.totalDebits.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Credits:</span> 
                <div className="font-mono text-lg text-green-600">-Rs. {balanceBreakdown.totalCredits.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Period Balance:</span> 
                <div className={`font-mono text-lg font-bold ${
                  balanceBreakdown.calculatedBalance > 0 ? 'text-red-600' : 
                  balanceBreakdown.calculatedBalance < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  Rs. {balanceBreakdown.calculatedBalance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History ({filteredTransactions.length} transactions)</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleAddTransaction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                            {transactions.length === 0 ? 'No transactions found. Add a transaction to get started.' : 'No transactions found in the selected date range.'}
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction, index) => {
                          // Calculate running balance up to this transaction
                          const runningBalance = filteredTransactions
                            .slice(0, index + 1)
                            .reduce((sum, t) => {
                              return sum + (t.transaction_type === 'credit' ? t.amount : -t.amount);
                            }, 0);
                          
                          return (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(transaction.transaction_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                {transaction.transaction_type === 'credit' ? (
                                  <span className="font-bold text-green-600">
                                    Rs. {transaction.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                {transaction.transaction_type === 'debit' ? (
                                  <span className="font-bold text-red-600">
                                    Rs. {transaction.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                <span className={`font-bold ${
                                  runningBalance > 0 ? 'text-red-600' : runningBalance < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  Rs. {runningBalance.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{transaction.reference}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => handleEditTransaction(transaction)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(transaction)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedTransaction ? 'Edit Transaction' : 'Add Transaction'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedTransaction ? 'Update transaction details' : 'Create a new transaction'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                {/* Transaction Type and Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Transaction Type *
                    </label>
                    <select
                      value={transactionForm.transaction_type}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_type: e.target.value as 'debit' | 'credit' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="debit">Debit (Money paid to vendor)</option>
                      <option value="credit">Credit (Money received from vendor)</option>
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
                      value={transactionForm.amount === 0 ? '' : transactionForm.amount}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="0.0"
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
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Transaction description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={transactionForm.reference}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, reference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                    value={transactionForm.transaction_date}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>

              </form>
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  {selectedTransaction ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  onClick={handleTransactionSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {selectedTransaction ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Vendor Balance Sheet - {vendor.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors print:hidden"
                >
                  <PrinterIcon className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-400 hover:text-gray-600 print:hidden"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="print-content">
              {/* Header */}
              <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Vendor Balance Sheet</h1>
                <p className="text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-600">Period: {dateRange.startDate} to {dateRange.endDate}</p>
              </div>

              {/* Vendor Information - Simplified */}
              <div className="mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Vendor ID: #{vendor.id}</h2>
                    <p className="text-gray-600">{vendor.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Current Balance</div>
                    <div className={`text-2xl font-bold ${
                      vendor.balance > 0 ? 'text-red-600' : vendor.balance < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      Rs. {vendor.balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Balance Summary (Filtered Period)</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="font-medium">Total Debits:</span> <span className="text-red-600">Rs. {balanceBreakdown.totalDebits.toLocaleString()}</span></div>
                    <div><span className="font-medium">Total Credits:</span> <span className="text-green-600">Rs. {balanceBreakdown.totalCredits.toLocaleString()}</span></div>
                    <div className="font-semibold text-lg border-t pt-2">
                      <span className="font-medium">Period Balance:</span> 
                      <span className={`ml-2 ${
                        balanceBreakdown.calculatedBalance > 0 ? 'text-red-600' : 
                        balanceBreakdown.calculatedBalance < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        Rs. {balanceBreakdown.calculatedBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Credit</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Debit</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Current Balance</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No transactions found in the selected period
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction, index) => {
                          // Calculate running balance up to this transaction
                          const runningBalance = filteredTransactions
                            .slice(0, index + 1)
                            .reduce((sum, t) => {
                              return sum + (t.transaction_type === 'credit' ? t.amount : -t.amount);
                            }, 0);
                          
                          return (
                            <tr key={transaction.id}>
                              <td className="border border-gray-300 px-4 py-2">
                                {new Date(transaction.transaction_date).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{transaction.description}</td>
                              <td className="border border-gray-300 px-4 py-2 font-mono">
                                {transaction.transaction_type === 'credit' ? (
                                  <span className="text-green-600 font-bold">
                                    Rs. {transaction.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-mono">
                                {transaction.transaction_type === 'debit' ? (
                                  <span className="text-red-600 font-bold">
                                    Rs. {transaction.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 font-mono">
                                <span className={`font-bold ${
                                  runningBalance > 0 ? 'text-red-600' : runningBalance < 0 ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  Rs. {runningBalance.toLocaleString()}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2">{transaction.reference}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>This is a computer-generated statement. No signature required.</p>
                <p>For any queries, please contact our support team.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Export to CSV</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>Exporting {filteredTransactions.length} transactions</p>
                <p>Period: {dateRange.startDate} to {dateRange.endDate}</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  exportToCSV();
                  setShowExportModal(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && transactionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Transaction</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left">
                <div className="text-sm">
                  <div><span className="font-medium">Date:</span> {new Date(transactionToDelete.transaction_date).toLocaleDateString()}</div>
                  <div><span className="font-medium">Type:</span> 
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      transactionToDelete.transaction_type === 'debit' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {transactionToDelete.transaction_type.toUpperCase()}
                    </span>
                  </div>
                  <div><span className="font-medium">Amount:</span> 
                    <span className={`ml-2 font-bold ${
                      transactionToDelete.transaction_type === 'debit' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transactionToDelete.transaction_type === 'debit' ? '+' : '-'}Rs. {transactionToDelete.amount.toLocaleString()}
                    </span>
                  </div>
                  {transactionToDelete.description && (
                    <div><span className="font-medium">Description:</span> {transactionToDelete.description}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setTransactionToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
