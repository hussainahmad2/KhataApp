import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useDate } from '../context/DateContext';
import { 
  MagnifyingGlassIcon, 
  DocumentArrowDownIcon, 
  PrinterIcon,
  FunnelIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Transaction {
  id: number;
  entity_type: 'customer' | 'vendor';
  entity_id: number;
  transaction_type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference: string;
  transaction_date: string;
  created_at: string;
  entity_name?: string;
  entity_email?: string;
}

interface DailySummary {
  date: string;
  total_debits: number;
  total_credits: number;
  net_amount: number;
  transaction_count: number;
}

export function Transactions() {
  const { user } = useAuth();
  const { selectedDate } = useDate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [entityTypeFilter, setEntityTypeFilter] = useState<'all' | 'customer' | 'vendor'>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, dateFilter, entityTypeFilter, transactionTypeFilter, showTodayOnly]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Load customers and vendors separately for entity names
      const [customersRes, vendorsRes] = await Promise.all([
        supabase.from('customers').select('id, name, email').eq('user_id', user.id),
        supabase.from('vendors').select('id, name, email').eq('user_id', user.id)
      ]);

      const customers = customersRes.data || [];
      const vendors = vendorsRes.data || [];

      const processedTransactions = data?.map(transaction => {
        const entity = transaction.entity_type === 'customer' 
          ? customers.find(c => c.id === transaction.entity_id)
          : vendors.find(v => v.id === transaction.entity_id);

        return {
          ...transaction,
          entity_name: entity?.name || `#${transaction.entity_id}`,
          entity_email: entity?.email || ''
        };
      }) || [];

      setTransactions(processedTransactions);
      calculateDailySummary(processedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailySummary = (transactions: Transaction[]) => {
    const summaryMap = new Map<string, DailySummary>();

    transactions.forEach(transaction => {
      const date = transaction.transaction_date;
      if (!summaryMap.has(date)) {
        summaryMap.set(date, {
          date,
          total_debits: 0,
          total_credits: 0,
          net_amount: 0,
          transaction_count: 0
        });
      }

      const summary = summaryMap.get(date)!;
      summary.transaction_count++;

      if (transaction.transaction_type === 'debit') {
        summary.total_debits += transaction.amount;
      } else {
        summary.total_credits += transaction.amount;
      }

      summary.net_amount = summary.total_debits - summary.total_credits;
    });

    const summaryArray = Array.from(summaryMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setDailySummary(summaryArray);
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.entity_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.transaction_date) >= new Date(dateFilter.startDate)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(transaction =>
        new Date(transaction.transaction_date) <= new Date(dateFilter.endDate)
      );
    }

    // Entity type filter
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.entity_type === entityTypeFilter);
    }

    // Transaction type filter
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.transaction_type === transactionTypeFilter);
    }

    // Today only filter
    if (showTodayOnly) {
      filtered = filtered.filter(transaction => transaction.transaction_date === selectedDate);
    }

    setFilteredTransactions(filtered);
  };

  const getTodaySummary = () => {
    const todaySummary = dailySummary.find(summary => summary.date === selectedDate);
    
    if (!todaySummary) {
      return {
        total_debits: 0,
        total_credits: 0,
        net_amount: 0,
        transaction_count: 0
      };
    }

    return todaySummary;
  };

  const exportToCSV = () => {
    // Format date to DD/MM/YYYY
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
          return sum + (t.transaction_type === 'debit' ? t.amount : -t.amount);
        }, 0);
      return { ...transaction, runningBalance };
    });

    // Create CSV content with proper formatting
    const headers = ['DATE', 'ENTITY TYPE', 'ENTITY NAME', 'DESCRIPTION', 'CREDIT', 'DEBIT', 'CURRENT BALANCE', 'REFERENCE'];
    const csvContent = [
      headers.join(','),
      ...transactionsWithBalance.map(transaction => {
        const formattedDate = formatDate(transaction.transaction_date);
        const entityType = transaction.entity_type.toUpperCase();
        const entityName = transaction.entity_name || '';
        const description = transaction.description || '';
        const reference = transaction.reference || '';
        const currentBalance = transaction.runningBalance;
        
        // Separate credit and debit amounts
        const creditAmount = transaction.transaction_type === 'credit' ? transaction.amount : 0;
        const debitAmount = transaction.transaction_type === 'debit' ? transaction.amount : 0;
        
        return [
          `"${formattedDate}"`,
          `"${entityType}"`,
          `"${entityName}"`,
          `"${description}"`,
          creditAmount,
          debitAmount,
          currentBalance,
          `"${reference}"`
        ].join(',');
      })
    ].join('\n');

    // Create HTML content for better formatting with colors
    const totalDebits = filteredTransactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const totalCredits = filteredTransactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const finalBalance = totalDebits - totalCredits;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Transaction Report</title>
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
          .entity-type { text-transform: uppercase; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Transaction Report</h2>
        <p><strong>Period:</strong> ${dateFilter.startDate || 'All'} to ${dateFilter.endDate || 'All'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        
             <table>
               <thead>
                 <tr>
                   <th>DATE</th>
                   <th>ENTITY TYPE</th>
                   <th>ENTITY NAME</th>
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
                   const entityType = transaction.entity_type.toUpperCase();
                   const entityName = transaction.entity_name || '';
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
                       <td class="entity-type">${entityType}</td>
                       <td>${entityName}</td>
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
          <p><strong>Total Debits:</strong> <span class="debit">+Rs. ${totalDebits.toLocaleString()}</span></p>
          <p><strong>Total Credits:</strong> <span class="credit">-Rs. ${totalCredits.toLocaleString()}</span></p>
          <p><strong>Final Balance:</strong> <span class="${finalBalance > 0 ? 'balance-positive' : finalBalance < 0 ? 'balance-negative' : 'balance-zero'}">Rs. ${finalBalance.toLocaleString()}</span></p>
        </div>
      </body>
      </html>
    `;

    // Create both CSV and HTML files
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    
    // Create download links
    const csvLink = document.createElement('a');
    const csvUrl = URL.createObjectURL(csvBlob);
    csvLink.setAttribute('href', csvUrl);
    csvLink.setAttribute('download', `transactions_${dateFilter.startDate || 'all'}_to_${dateFilter.endDate || 'all'}.csv`);
    csvLink.style.visibility = 'hidden';
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
    
    // Also create HTML version
    const htmlLink = document.createElement('a');
    const htmlUrl = URL.createObjectURL(htmlBlob);
    htmlLink.setAttribute('href', htmlUrl);
    htmlLink.setAttribute('download', `transactions_${dateFilter.startDate || 'all'}_to_${dateFilter.endDate || 'all'}.html`);
    htmlLink.style.visibility = 'hidden';
    document.body.appendChild(htmlLink);
    htmlLink.click();
    document.body.removeChild(htmlLink);
  };

  const printTransactions = () => {
    setShowPrintModal(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setEntityTypeFilter('all');
    setTransactionTypeFilter('all');
    setShowTodayOnly(false);
  };

  // Calculate summary based on filtered transactions (not just today)
  const getFilteredSummary = () => {
    const total_debits = filteredTransactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    const total_credits = filteredTransactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const net_amount = total_debits - total_credits;
    const transaction_count = filteredTransactions.length;
    return { total_debits, total_credits, net_amount, transaction_count };
  };
  const filteredSummary = getFilteredSummary();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
        <p className="text-gray-600">View and manage all customer and vendor transactions</p>
      </div>

      {/* Filtered Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            Summary (Filtered Data)
          </h2>
          <div className="text-sm text-gray-600">
            {dateFilter.startDate || dateFilter.endDate ? `${dateFilter.startDate || '...'} to ${dateFilter.endDate || '...'}` : new Date().toLocaleDateString()}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-red-600">Rs. {filteredSummary.total_debits.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-green-600">Rs. {filteredSummary.total_credits.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Net Amount</p>
                <p className={`text-2xl font-bold ${filteredSummary.net_amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs. {Math.abs(filteredSummary.net_amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{filteredSummary.transaction_count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search transactions..."
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value as 'all' | 'customer' | 'vendor')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Entities</option>
              <option value="customer">Customers Only</option>
              <option value="vendor">Vendors Only</option>
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value as 'all' | 'debit' | 'credit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="debit">Debits Only</option>
              <option value="credit">Credits Only</option>
            </select>
          </div>

          {/* Today Only Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="todayOnly"
              checked={showTodayOnly}
              onChange={(e) => setShowTodayOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="todayOnly" className="ml-2 text-sm font-medium text-gray-700">
              Today Only
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printTransactions}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No transactions found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{transaction.entity_name}</div>
                          <div className="text-gray-500 text-xs">
                            {transaction.entity_type === 'customer' ? 'Customer' : 'Vendor'} #{transaction.entity_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.transaction_type === 'debit' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {transaction.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        <span className={`font-bold ${
                          transaction.transaction_type === 'debit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.transaction_type === 'debit' ? '+' : '-'}Rs. {transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transaction.reference}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Export Transactions</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600">
                Exporting {filteredTransactions.length} transactions
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

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Transaction Report</h3>
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
                  ×
                </button>
              </div>
            </div>

            <div className="print-content">
              {/* Header */}
              <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Transaction Report</h1>
                <p className="text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
                <p className="text-gray-600">
                  Period: {dateFilter.startDate || 'All'} to {dateFilter.endDate || 'All'}
                </p>
              </div>

              {/* Summary */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Transactions:</span> {filteredTransactions.length}
                  </div>
                  <div>
                    <span className="font-medium">Total Debits:</span> 
                    <span className="text-red-600 font-bold ml-2">
                      Rs. {filteredTransactions.filter(t => t.transaction_type === 'debit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Total Credits:</span> 
                    <span className="text-green-600 font-bold ml-2">
                      Rs. {filteredTransactions.filter(t => t.transaction_type === 'credit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </span>
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
                        <th className="border border-gray-300 px-4 py-2 text-left">Entity</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Amount</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-300 px-4 py-2 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="border border-gray-300 px-4 py-2">
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {transaction.entity_name} ({transaction.entity_type})
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                              {transaction.transaction_type.toUpperCase()}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{transaction.description}</td>
                            <td className="border border-gray-300 px-4 py-2 font-mono">
                              <span className={`font-bold ${
                                transaction.transaction_type === 'debit' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {transaction.transaction_type === 'debit' ? '+' : '-'}Rs. {transaction.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{transaction.reference}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                <p>This is a computer-generated report. No signature required.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
