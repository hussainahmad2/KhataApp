import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { VendorModal } from '../components/Vendors/VendorModal';
import { VendorDetailModal } from '../components/Vendors/VendorDetailModal';
import { QuickTransactionModal } from '../components/QuickTransactionModal';
import { useDate } from '../context/DateContext';

interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  status: string;
  created_at: string;
}

export function Vendors() {
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [vendorForDetail, setVendorForDetail] = useState<Vendor | null>(null);
  const [showQuickTransactionModal, setShowQuickTransactionModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const { selectedDate } = useDate();

  useEffect(() => {
    loadVendors();
    
    // Check if we should auto-open the add modal
    const action = searchParams.get('action');
    if (action === 'add') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setIsModalOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleViewVendorDetails = (vendor: Vendor) => {
    setVendorForDetail(vendor);
    setIsDetailModalOpen(true);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;

    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorToDelete.id);

      if (error) throw error;
      await loadVendors();
      setShowDeleteDialog(false);
      setVendorToDelete(null);
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.email && vendor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    vendor.id.toString().includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600'; // We owe vendor money
    if (balance < 0) return 'text-green-600'; // Vendor owes us money
    return 'text-gray-600';
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowQuickTransactionModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={handleAddVendor}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors by ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-6 text-sm items-center">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{vendors.length}</div>
              <div className="text-gray-500">Total Vendors</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {vendors.filter(v => v.status === 'active').length}
              </div>
              <div className="text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Selected date</div>
              <div className="font-medium">{selectedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Balance
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
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewVendorDetails(vendor)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-medium text-gray-900">
                      #{vendor.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {vendor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.email || 'No email'}</div>
                    <div className="text-sm text-gray-500">{vendor.phone || 'No phone'}</div>
                    <div className="text-sm text-gray-500">{vendor.address || 'No address'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getBalanceColor(vendor.balance)}`}>
                      Rs. {Math.abs(vendor.balance).toLocaleString()}
                      <span className="text-xs ml-1">
                        {vendor.balance > 0 ? '(Payable)' : vendor.balance < 0 ? '(Receivable)' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleViewVendorDetails(vendor)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit Vendor"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Vendor"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vendor={selectedVendor}
        onSuccess={loadVendors}
      />

      {/* Vendor Detail Modal */}
      {vendorForDetail && (
        <VendorDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          vendor={vendorForDetail}
          onSuccess={loadVendors}
        />
      )}

      {/* Quick Transaction Modal */}
      <QuickTransactionModal
        isOpen={showQuickTransactionModal}
        onClose={() => setShowQuickTransactionModal(false)}
        onSuccess={loadVendors}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && vendorToDelete && (
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Vendor</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this vendor? This action cannot be undone and will also delete all associated transactions.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left">
                <div className="text-sm">
                  <div><span className="font-medium">ID:</span> #{vendorToDelete.id}</div>
                  <div><span className="font-medium">Name:</span> {vendorToDelete.name}</div>
                  <div><span className="font-medium">Email:</span> {vendorToDelete.email}</div>
                  <div><span className="font-medium">Current Balance:</span> 
                    <span className={`ml-2 font-bold ${
                      vendorToDelete.balance > 0 ? 'text-red-600' : vendorToDelete.balance < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      Rs. {vendorToDelete.balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setVendorToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteVendor}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}