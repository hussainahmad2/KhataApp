import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { generateReportPDF } from '../utils/pdfGenerator';
import { useDate } from '../context/DateContext';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function Reports() {
  const [reportType, setReportType] = useState('dashboard');
  const { selectedDate } = useDate();
  // default startDate: first day of selectedDate's month
  const selected = new Date(selectedDate);
  const defaultStart = new Date(selected.getFullYear(), selected.getMonth(), 1).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({
    startDate: defaultStart,
    endDate: selectedDate,
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      totalCustomers: 0,
      totalVendors: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      totalReceivables: 0,
      totalPayables: 0
    },
    monthlyData: [] as any[],
    customerDistribution: [] as any[],
    vendorDistribution: [] as any[],
    paymentStatusData: [] as any[],
    agedReceivablesData: [] as any[],
    revenueTrend: [] as any[],
    expenseTrend: [] as any[]
  });

  useEffect(() => {
    if (reportType === 'dashboard') {
      generateDashboardData();
    } else {
      generateReport();
    }
  }, [reportType, dateRange]);

  const generateDashboardData = async () => {
    setLoading(true);
    try {
      const kpis = await generateKPIs();
      const monthlyData = await generateMonthlyData();
      const customerDistribution = await generateCustomerDistribution();
      const vendorDistribution = await generateVendorDistribution();
      const paymentStatusData = await generatePaymentStatusData();
      const agedReceivablesData = await generateAgedReceivablesData();
      const revenueTrend = await generateRevenueTrend();
      const expenseTrend = await generateExpenseTrend();

      setDashboardData({
        kpis,
        monthlyData,
        customerDistribution,
        vendorDistribution,
        paymentStatusData,
        agedReceivablesData,
        revenueTrend,
        expenseTrend
      });
    } catch (error) {
      console.error('Error generating dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      switch (reportType) {
        case 'balance-sheet':
          data = await generateBalanceSheet();
          break;
        case 'customer-statement':
          data = await generateCustomerStatement();
          break;
        case 'vendor-statement':
          data = await generateVendorStatement();
          break;
        case 'income-statement':
          data = await generateIncomeStatement();
          break;
        case 'aged-receivables':
          data = await generateAgedReceivables();
          break;
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dashboard Data Generation Functions
  const generateKPIs = async () => {
    const { data: customers } = await supabase.from('customers').select('balance');
    const { data: vendors } = await supabase.from('vendors').select('balance');
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', dateRange.startDate)
      .lte('payment_date', dateRange.endDate);
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, status, due_date')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalReceivables = customers?.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0) || 0;
    const totalPayables = vendors?.reduce((sum, v) => sum + (v.balance > 0 ? v.balance : 0), 0) || 0;
    const pendingInvoices = invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0) || 0;
    
    const today = new Date();
    const overdueInvoices = invoices?.filter(i => {
      const dueDate = new Date(i.due_date);
      return i.status === 'pending' && dueDate < today;
    }).reduce((sum, i) => sum + i.total_amount, 0) || 0;

    return {
      totalRevenue,
      totalExpenses: totalPayables,
      netIncome: totalRevenue - totalPayables,
      totalCustomers: customers?.length || 0,
      totalVendors: vendors?.length || 0,
      pendingInvoices,
      overdueInvoices,
      totalReceivables,
      totalPayables
    };
  };

  const generateMonthlyData = async () => {
    const months = [];
    const currentDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    while (currentDate <= endDate) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', monthStart.toISOString().split('T')[0])
        .lte('payment_date', monthEnd.toISOString().split('T')[0]);
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', monthStart.toISOString().split('T')[0])
        .lte('created_at', monthEnd.toISOString().split('T')[0]);

      months.push({
        month: currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        expenses: invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };

  const generateCustomerDistribution = async () => {
    const { data: customers } = await supabase.from('customers').select('balance');
    const positive = customers?.filter(c => c.balance > 0).length || 0;
    const negative = customers?.filter(c => c.balance < 0).length || 0;
    const zero = customers?.filter(c => c.balance === 0).length || 0;
    
    return [
      { name: 'Positive Balance', value: positive, color: '#10B981' },
      { name: 'Negative Balance', value: negative, color: '#EF4444' },
      { name: 'Zero Balance', value: zero, color: '#6B7280' }
    ];
  };

  const generateVendorDistribution = async () => {
    const { data: vendors } = await supabase.from('vendors').select('balance');
    const positive = vendors?.filter(v => v.balance > 0).length || 0;
    const negative = vendors?.filter(v => v.balance < 0).length || 0;
    const zero = vendors?.filter(v => v.balance === 0).length || 0;
    
    return [
      { name: 'Positive Balance', value: positive, color: '#10B981' },
      { name: 'Negative Balance', value: negative, color: '#EF4444' },
      { name: 'Zero Balance', value: zero, color: '#6B7280' }
    ];
  };

  const generatePaymentStatusData = async () => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('status')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
    
    const paid = invoices?.filter(i => i.status === 'paid').length || 0;
    const pending = invoices?.filter(i => i.status === 'pending').length || 0;
    const overdue = invoices?.filter(i => i.status === 'overdue').length || 0;
    
    return [
      { name: 'Paid', value: paid, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'Overdue', value: overdue, color: '#EF4444' }
    ];
  };

  const generateAgedReceivablesData = async () => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, due_date, status')
      .eq('status', 'pending');

    const today = new Date();
    const agedData = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    invoices?.forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue <= 30) agedData['0-30'] += invoice.total_amount;
      else if (daysPastDue <= 60) agedData['31-60'] += invoice.total_amount;
      else if (daysPastDue <= 90) agedData['61-90'] += invoice.total_amount;
      else agedData['90+'] += invoice.total_amount;
    });

    return Object.entries(agedData).map(([range, amount]) => ({
      range,
      amount,
      color: range === '0-30' ? '#10B981' : range === '31-60' ? '#F59E0B' : range === '61-90' ? '#EF4444' : '#DC2626'
    }));
  };

  const generateRevenueTrend = async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .gte('payment_date', dateRange.startDate)
      .lte('payment_date', dateRange.endDate)
      .order('payment_date');

    const dailyRevenue: { [key: string]: number } = {};
    payments?.forEach(payment => {
      const date = payment.payment_date.split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });

    return Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount
    }));
  };

  const generateExpenseTrend = async () => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, created_at')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate)
      .order('created_at');

    const dailyExpenses: { [key: string]: number } = {};
    invoices?.forEach(invoice => {
      const date = invoice.created_at.split('T')[0];
      dailyExpenses[date] = (dailyExpenses[date] || 0) + invoice.total_amount;
    });

    return Object.entries(dailyExpenses).map(([date, amount]) => ({
      date,
      amount
    }));
  };

  const generateBalanceSheet = async () => {
    const { data: customers } = await supabase.from('customers').select('name, balance');
    const { data: vendors } = await supabase.from('vendors').select('name, balance');
    const { data: invoices } = await supabase.from('invoices').select('total_amount, status');
    const { data: payments } = await supabase.from('payments').select('amount');

    const totalReceivables = customers?.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0) || 0;
    const totalPayables = vendors?.reduce((sum, v) => sum + (v.balance > 0 ? v.balance : 0), 0) || 0;
    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingInvoices = invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0) || 0;

    return [
      { account: 'Assets', type: 'header', amount: '' },
      { account: 'Accounts Receivable', type: 'item', amount: totalReceivables },
      { account: 'Pending Invoices', type: 'item', amount: pendingInvoices },
      { account: 'Total Assets', type: 'total', amount: totalReceivables + pendingInvoices },
      { account: '', type: 'spacer', amount: '' },
      { account: 'Liabilities', type: 'header', amount: '' },
      { account: 'Accounts Payable', type: 'item', amount: totalPayables },
      { account: 'Total Liabilities', type: 'total', amount: totalPayables },
      { account: '', type: 'spacer', amount: '' },
      { account: 'Equity', type: 'header', amount: '' },
      { account: 'Retained Earnings', type: 'item', amount: totalRevenue - totalPayables },
      { account: 'Total Equity', type: 'total', amount: totalRevenue - totalPayables },
    ];
  };

  const generateCustomerStatement = async () => {
    const { data } = await supabase
      .from('customers')
      .select('name, email, balance, status')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
    
    return data || [];
  };

  const generateVendorStatement = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('name, email, balance, status')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);
    
    return data || [];
  };

  const generateIncomeStatement = async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .gte('payment_date', dateRange.startDate)
      .lte('payment_date', dateRange.endDate);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, tax_amount')
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalTax = invoices?.reduce((sum, i) => sum + i.tax_amount, 0) || 0;

    return [
      { category: 'Revenue', type: 'header', amount: '' },
      { category: 'Sales Revenue', type: 'item', amount: totalRevenue },
      { category: 'Total Revenue', type: 'total', amount: totalRevenue },
      { category: '', type: 'spacer', amount: '' },
      { category: 'Expenses', type: 'header', amount: '' },
      { category: 'Tax Expense', type: 'item', amount: totalTax },
      { category: 'Total Expenses', type: 'total', amount: totalTax },
      { category: '', type: 'spacer', amount: '' },
      { category: 'Net Income', type: 'final', amount: totalRevenue - totalTax },
    ];
  };

  const generateAgedReceivables = async () => {
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        total_amount,
        due_date,
        status,
        customers (name)
      `)
      .eq('status', 'pending');

    const today = new Date();
    
    return invoices?.map(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let ageGroup = '0-30 days';
      if (daysPastDue > 90) ageGroup = 'Over 90 days';
      else if (daysPastDue > 60) ageGroup = '61-90 days';
      else if (daysPastDue > 30) ageGroup = '31-60 days';
      
      return {
        customer_name: (invoice.customers as any)?.name || 'N/A',
        invoice_number: invoice.invoice_number,
        amount: invoice.total_amount,
        due_date: invoice.due_date,
        days_past_due: daysPastDue,
        age_group: ageGroup,
      };
    }) || [];
  };

  const exportToPDF = () => {
    const title = getReportTitle();
    const columns = getReportColumns();
    generateReportPDF(title, reportData, columns);
  };

  const exportToCSV = () => {
    const title = getReportTitle();
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'dashboard': return 'Financial Dashboard';
      case 'balance-sheet': return 'Balance Sheet';
      case 'customer-statement': return 'Customer Statement';
      case 'vendor-statement': return 'Vendor Statement';
      case 'income-statement': return 'Income Statement';
      case 'aged-receivables': return 'Aged Receivables';
      default: return 'Report';
    }
  };

  const getReportColumns = () => {
    switch (reportType) {
      case 'balance-sheet': return ['Account', 'Type', 'Amount'];
      case 'customer-statement': return ['Name', 'Email', 'Balance', 'Status'];
      case 'vendor-statement': return ['Name', 'Email', 'Balance', 'Status'];
      case 'income-statement': return ['Category', 'Type', 'Amount'];
      case 'aged-receivables': return ['Customer Name', 'Invoice Number', 'Amount', 'Due Date', 'Days Past Due', 'Age Group'];
      default: return [];
    }
  };

  const renderReportTable = () => {
    const columns = getReportColumns();
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((row, index) => (
              <tr key={index} className={`
                ${row.type === 'header' ? 'bg-blue-50 font-semibold' : ''}
                ${row.type === 'total' ? 'bg-gray-50 font-semibold' : ''}
                ${row.type === 'final' ? 'bg-green-50 font-bold' : ''}
                ${row.type === 'spacer' ? 'bg-transparent' : 'hover:bg-gray-50'}
              `}>
                {columns.map((column) => {
                  const key = column.toLowerCase().replace(/\s+/g, '_');
                  const value = row[key] || row[Object.keys(row)[0]] || '';
                  
                  return (
                    <td key={column} className="px-6 py-3 whitespace-nowrap text-sm">
                      {typeof value === 'number' && column.toLowerCase().includes('amount') 
                        ? `Rs. ${value.toLocaleString()}`
                        : value
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // KPI Card Component
  const KPICard = ({ title, value, icon: Icon, trend, color, bgColor }: any) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-lg border border-white/20 backdrop-blur-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === 'number' && title.toLowerCase().includes('revenue') || title.toLowerCase().includes('expense') || title.toLowerCase().includes('income') || title.toLowerCase().includes('receivable') || title.toLowerCase().includes('payable') || title.toLowerCase().includes('invoice')
              ? `Rs. ${value.toLocaleString()}`
              : value
            }
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor.replace('bg-', 'bg-').replace('/20', '/30')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center">
          {trend > 0 ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend)}% from last period
          </span>
        </div>
      )}
    </div>
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial insights and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToPDF}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={exportToCSV}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <TableCellsIcon className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="dashboard">📊 Dashboard</option>
              <option value="balance-sheet">📋 Balance Sheet</option>
              <option value="customer-statement">👥 Customer Statement</option>
              <option value="vendor-statement">🏢 Vendor Statement</option>
              <option value="income-statement">💰 Income Statement</option>
              <option value="aged-receivables">⏰ Aged Receivables</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (reportType === 'dashboard') {
                  generateDashboardData();
                } else {
                  generateReport();
                }
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {reportType === 'dashboard' ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Revenue"
              value={dashboardData.kpis.totalRevenue}
              icon={CurrencyDollarIcon}
              color="text-green-600"
              bgColor="bg-green-50/80"
            />
            <KPICard
              title="Total Expenses"
              value={dashboardData.kpis.totalExpenses}
              icon={ArrowTrendingDownIcon}
              color="text-red-600"
              bgColor="bg-red-50/80"
            />
            <KPICard
              title="Net Income"
              value={dashboardData.kpis.netIncome}
              icon={ArrowTrendingUpIcon}
              color={dashboardData.kpis.netIncome >= 0 ? "text-green-600" : "text-red-600"}
              bgColor={dashboardData.kpis.netIncome >= 0 ? "bg-green-50/80" : "bg-red-50/80"}
            />
            <KPICard
              title="Total Customers"
              value={dashboardData.kpis.totalCustomers}
              icon={UsersIcon}
              color="text-blue-600"
              bgColor="bg-blue-50/80"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Vendors"
              value={dashboardData.kpis.totalVendors}
              icon={BuildingOfficeIcon}
              color="text-purple-600"
              bgColor="bg-purple-50/80"
            />
            <KPICard
              title="Pending Invoices"
              value={dashboardData.kpis.pendingInvoices}
              icon={DocumentArrowDownIcon}
              color="text-yellow-600"
              bgColor="bg-yellow-50/80"
            />
            <KPICard
              title="Overdue Invoices"
              value={dashboardData.kpis.overdueInvoices}
              icon={CalendarIcon}
              color="text-red-600"
              bgColor="bg-red-50/80"
            />
            <KPICard
              title="Total Receivables"
              value={dashboardData.kpis.totalReceivables}
              icon={ChartBarIcon}
              color="text-indigo-600"
              bgColor="bg-indigo-50/80"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Trend */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
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

            {/* Payment Status Distribution */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aged Receivables */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aged Receivables</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.agedReceivablesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {dashboardData.agedReceivablesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Customer Balance Distribution */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Balance Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.customerDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.customerDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Traditional Report View */
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {getReportTitle()}
              </h3>
              <div className="text-sm text-gray-500">
                Period: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderReportTable()
            )}
          </div>
        </div>
      )}
    </div>
  );
}