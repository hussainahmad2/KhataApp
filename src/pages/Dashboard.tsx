import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { CustomerDetailModal } from '../components/Customers/CustomerDetailModal';
import { VendorDetailModal } from '../components/Vendors/VendorDetailModal';

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalVendors: number;
  totalInvoices: number;
  pendingInvoices: number;
  overduePays: number;
  totalInventoryValue: number;
  lowStockItems: number;
}


interface CustomerListItem {
  id: number;
  name: string;
  balance: number;
  lastTransaction: string;
  lastTransactionDate: string;
}

interface VendorListItem {
  id: number;
  name: string;
  balance: number;
  lastTransaction: string;
  lastTransactionDate: string;
}

interface PaymentStatusData {
  name: string;
  value: number;
  color: string;
}

interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalCustomers: 0,
    totalVendors: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    overduePays: 0,
    totalInventoryValue: 0,
    lowStockItems: 0,
  });

  const [paymentStatusData, setPaymentStatusData] = useState<PaymentStatusData[]>([]);
  const [revenueExpenseData, setRevenueExpenseData] = useState<RevenueExpenseData[]>([]);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [customersRes, vendorsRes, invoicesRes, paymentsRes, inventoryRes, transactionsRes] = await Promise.all([
        supabase.from('customers').select('id, name, balance'),
        supabase.from('vendors').select('id, name, balance'),
        supabase.from('invoices').select('id, total_amount, status, due_date, created_at'),
        supabase.from('payments').select('amount, payment_date'),
        supabase.from('inventory').select('quantity, unit_price, reorder_level'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false })
      ]);

      // Calculate stats
      const totalCustomers = customersRes.data?.length || 0;
      const totalVendors = vendorsRes.data?.length || 0;
      const totalInvoices = invoicesRes.data?.length || 0;
      const totalRevenue = paymentsRes.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      
      const pendingInvoices = invoicesRes.data?.filter(invoice => invoice.status === 'pending').length || 0;
      const overdueInvoices = invoicesRes.data?.filter(invoice => 
        invoice.status === 'pending' && new Date(invoice.due_date) < new Date()
      ).length || 0;

      const totalInventoryValue = inventoryRes.data?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
      const lowStockItems = inventoryRes.data?.filter(item => item.quantity <= item.reorder_level).length || 0;

      setStats({
        totalRevenue,
        totalCustomers,
        totalVendors,
        totalInvoices,
        pendingInvoices,
        overduePays: overdueInvoices,
        totalInventoryValue,
        lowStockItems,
      });

      // Generate revenue vs expenses data
      const now = new Date();
      const revenueExpenseData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        const monthRevenue = paymentsRes.data?.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate.getMonth() === date.getMonth() && 
                 paymentDate.getFullYear() === date.getFullYear();
        }).reduce((sum, payment) => sum + payment.amount, 0) || 0;

        const monthExpenses = transactionsRes.data?.filter(transaction => {
          const transactionDate = new Date(transaction.transaction_date);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear() &&
                 transaction.transaction_type === 'debit';
        }).reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

        revenueExpenseData.push({
          month: monthName,
          revenue: monthRevenue,
          expenses: monthExpenses
        });
      }
      setRevenueExpenseData(revenueExpenseData);

      // Generate payment status data
      const paidInvoices = invoicesRes.data?.filter(invoice => invoice.status === 'paid').length || 0;
      const pendingInvoicesCount = invoicesRes.data?.filter(invoice => invoice.status === 'pending').length || 0;
      const overdueInvoicesCount = invoicesRes.data?.filter(invoice => 
        invoice.status === 'pending' && new Date(invoice.due_date) < new Date()
      ).length || 0;

      setPaymentStatusData([
        { name: 'Paid', value: paidInvoices, color: '#10B981' },
        { name: 'Pending', value: pendingInvoicesCount, color: '#F59E0B' },
        { name: 'Overdue', value: overdueInvoicesCount, color: '#EF4444' }
      ]);

      // Load customer data with last transaction
      const customerData = await Promise.all(
        (customersRes.data || []).map(async (customer) => {
          const lastTransaction = transactionsRes.data?.find(
            t => t.entity_type === 'customer' && t.entity_id === customer.id
          );
          
          return {
            id: customer.id,
            name: customer.name,
            balance: customer.balance,
            lastTransaction: lastTransaction ? 
              `${lastTransaction.transaction_type === 'credit' ? 'Received' : 'Paid'} Rs. ${lastTransaction.amount.toLocaleString()}` : 
              'No transactions',
            lastTransactionDate: lastTransaction?.transaction_date || 'N/A'
          };
        })
      );
      setCustomers(customerData.slice(0, 5)); // Show only top 5

      // Load vendor data with last transaction
      const vendorData = await Promise.all(
        (vendorsRes.data || []).map(async (vendor) => {
          const lastTransaction = transactionsRes.data?.find(
            t => t.entity_type === 'vendor' && t.entity_id === vendor.id
          );
          
          return {
            id: vendor.id,
            name: vendor.name,
            balance: vendor.balance,
            lastTransaction: lastTransaction ? 
              `${lastTransaction.transaction_type === 'credit' ? 'Received' : 'Paid'} Rs. ${lastTransaction.amount.toLocaleString()}` : 
              'No transactions',
            lastTransactionDate: lastTransaction?.transaction_date || 'N/A'
          };
        })
      );
      setVendors(vendorData.slice(0, 5)); // Show only top 5

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers.toString(),
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Vendors',
      value: stats.totalVendors.toString(),
      icon: BuildingStorefrontIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Inventory Value',
      value: `Rs. ${stats.totalInventoryValue.toLocaleString()}`,
      icon: CubeIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      title: 'Pending Invoices',
      value: stats.pendingInvoices.toString(),
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Overdue Payments',
      value: stats.overduePays.toString(),
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ];


  // Handle customer selection
  const handleCustomerClick = async (customer: CustomerListItem) => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single();
      
      if (data) {
        setSelectedCustomer(data);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  // Handle vendor selection
  const handleVendorClick = async (vendor: VendorListItem) => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendor.id)
        .single();
      
      if (data) {
        setSelectedVendor(data);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'addCustomer':
        navigate('/customers?action=add');
        break;
      case 'createInvoice':
        navigate('/invoices?action=add');
        break;
      case 'addInventory':
        navigate('/inventory?action=add');
        break;
      case 'addVendor':
        navigate('/vendors?action=add');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: Rs. {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Comprehensive overview of your business performance</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 ${card.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor} shadow-lg`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue vs Expenses Area Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Revenue vs Expenses</h3>
              <div className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Status Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Customer and Vendor Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customers List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                  Recent Customers
                </h3>
                <button
                  onClick={() => navigate('/customers')}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerClick(customer)}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-sm">#{customer.id}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {customer.name}
                          </h4>
                          <p className="text-sm text-gray-500">{customer.lastTransaction}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${customer.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs. {customer.balance.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">{customer.lastTransactionDate}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {customers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No customers found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vendors List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <BuildingStorefrontIcon className="h-6 w-6 text-purple-600 mr-3" />
                  Recent Vendors
                </h3>
                <button
                  onClick={() => navigate('/vendors')}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <span>View All</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => handleVendorClick(vendor)}
                    className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold text-sm">#{vendor.id}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {vendor.name}
                          </h4>
                          <p className="text-sm text-gray-500">{vendor.lastTransaction}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${vendor.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Rs. {vendor.balance.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">{vendor.lastTransactionDate}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {vendors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BuildingStorefrontIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No vendors found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Quick Actions</h3>
            <p className="text-blue-100">Streamline your workflow with these essential tools</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button 
              onClick={() => handleQuickAction('addCustomer')} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20"
            >
              <UsersIcon className="h-10 w-10 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold">Add Customer</div>
              <div className="text-xs text-blue-100 mt-1">New client</div>
            </button>
            <button 
              onClick={() => handleQuickAction('createInvoice')} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20"
            >
              <DocumentTextIcon className="h-10 w-10 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold">Create Invoice</div>
              <div className="text-xs text-blue-100 mt-1">Bill client</div>
            </button>
            <button 
              onClick={() => handleQuickAction('addInventory')} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20"
            >
              <CubeIcon className="h-10 w-10 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold">Add Inventory</div>
              <div className="text-xs text-blue-100 mt-1">Stock items</div>
            </button>
            <button 
              onClick={() => handleQuickAction('addVendor')} 
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 cursor-pointer group border border-white/20"
            >
              <BuildingStorefrontIcon className="h-10 w-10 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <div className="font-semibold">Add Vendor</div>
              <div className="text-xs text-blue-100 mt-1">New supplier</div>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSuccess={() => {
            setSelectedCustomer(null);
            loadDashboardData(); // Refresh data after changes
          }}
        />
      )}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          isOpen={!!selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onSuccess={() => {
            setSelectedVendor(null);
            loadDashboardData(); // Refresh data after changes
          }}
        />
      )}
    </div>
  );
}