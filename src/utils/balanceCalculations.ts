interface BalanceUpdate {
  customerId?: number;
  vendorId?: number;
  amount: number;
  type: 'debit' | 'credit';
  description?: string;
}

export const updateCustomerBalance = async (
  supabase: any,
  customerId: number,
  amount: number,
  type: 'debit' | 'credit'
) => {
  try {
    // Get current balance
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('balance')
      .eq('id', customerId)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = customer.balance || 0;
    const newBalance = type === 'debit' 
      ? currentBalance + amount  // Customer owes us more
      : currentBalance - amount; // Customer paid us

    // Update balance
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating customer balance:', error);
    return { success: false, error };
  }
};

export const updateVendorBalance = async (
  supabase: any,
  vendorId: number,
  amount: number,
  type: 'debit' | 'credit'
) => {
  try {
    // Get current balance
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('balance')
      .eq('id', vendorId)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = vendor.balance || 0;
    const newBalance = type === 'debit' 
      ? currentBalance - amount  // We paid vendor
      : currentBalance + amount; // We owe vendor more

    // Update balance
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (updateError) throw updateError;

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating vendor balance:', error);
    return { success: false, error };
  }
};

export const calculateInvoiceTotal = (
  items: { quantity: number; unit_price: number }[],
  taxRate: number = 17
) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2))
  };
};

export const getAgedReceivables = (invoices: any[]) => {
  const today = new Date();
  const aged = {
    '0-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 }
  };

  invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue')
    .forEach(invoice => {
      const dueDate = new Date(invoice.due_date);
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue <= 30) {
        aged['0-30'].count++;
        aged['0-30'].amount += invoice.total_amount;
      } else if (daysPastDue <= 60) {
        aged['31-60'].count++;
        aged['31-60'].amount += invoice.total_amount;
      } else if (daysPastDue <= 90) {
        aged['61-90'].count++;
        aged['61-90'].amount += invoice.total_amount;
      } else {
        aged['90+'].count++;
        aged['90+'].amount += invoice.total_amount;
      }
    });

  return [
    { name: '0-30 days', value: aged['0-30'].count, amount: aged['0-30'].amount },
    { name: '31-60 days', value: aged['31-60'].count, amount: aged['31-60'].amount },
    { name: '61-90 days', value: aged['61-90'].count, amount: aged['61-90'].amount },
    { name: 'Over 90 days', value: aged['90+'].count, amount: aged['90+'].amount },
  ];
};