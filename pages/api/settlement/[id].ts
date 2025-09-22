import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { fromDate, toDate, search } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Settlement ID is required' });
    }

    // Build query parameters for client-accounts API
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('fromDate', fromDate as string);
    if (toDate) queryParams.append('toDate', toDate as string);
    if (search) queryParams.append('search', search as string);

    // Fetch data from client-accounts API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const clientAccountsResponse = await fetch(`${baseUrl}/api/client-accounts/${id}?${queryParams}`);
    
    if (!clientAccountsResponse.ok) {
      return res.status(clientAccountsResponse.status).json({ 
        message: 'Failed to fetch client account data' 
      });
    }

    const clientAccountData = await clientAccountsResponse.json();

    if (!clientAccountData) {
      return res.status(404).json({ message: 'Settlement not found' });
    }

    // Separate payments (credit entries) and expenses (debit entries)
    const payments = clientAccountData.entries.filter((entry: any) => Number(entry.credit) > 0);
    const expenses = clientAccountData.entries.filter((entry: any) => Number(entry.debit) > 0);

    // Calculate totals
    const totalPayments = payments.reduce((sum: number, entry: any) => sum + Number(entry.credit), 0);
    const totalExpenses = expenses.reduce((sum: number, entry: any) => sum + Number(entry.debit), 0);
    const netAmount = totalPayments - totalExpenses;

    // Transform data
    const contractInfo = {
      id: clientAccountData.id,
      contractNumber: clientAccountData.contractNumber || `#${clientAccountData.id}`,
      clientName: clientAccountData.client?.fullname || 'غير محدد',
      startDate: clientAccountData.createdAt ? new Date(clientAccountData.createdAt).toISOString().split('T')[0] : '',
      endDate: clientAccountData.updatedAt ? new Date(clientAccountData.updatedAt).toISOString().split('T')[0] : '',
      contractValue: clientAccountData.totalRevenue || 0,
      totalPaid: totalPayments,
      totalExpenses: totalExpenses,
      netAmount: netAmount
    };

    const transformedPayments = payments.map((entry: any, index: number) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      paymentNumber: `دفعة ${index + 1}`,
      description: entry.description || 'دفعة',
      amount: Number(entry.credit)
    }));

    const transformedExpenses = expenses.map((entry: any, index: number) => ({
      id: entry.id,
      date: new Date(entry.date).toISOString().split('T')[0],
      type: entry.entryType || 'مصروف',
      description: entry.description || 'مصروف',
      amount: Number(entry.debit),
      paymentMethod: 'تحويل بنكي',
      beneficiary: 'مساند'
    }));

    const response = {
      contract: contractInfo,
      payments: transformedPayments,
      expenses: transformedExpenses,
      summary: {
        totalPayments,
        totalExpenses,
        netAmount
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching settlement data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
