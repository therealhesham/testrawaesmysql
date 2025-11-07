import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const fromDateStr = Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate;
    const toDateStr = Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate;
    const searchStr = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

    if (!id) {
      return res.status(400).json({ message: 'Settlement ID is required' });
    }

    // Build where clause for filtering entries
    const whereClause = {
      AND: [] as Prisma.ClientAccountEntryWhereInput[]
    };

    if (fromDateStr) {
      whereClause.AND.push({ date: { gte: new Date(fromDateStr) } });
    }
    if (toDateStr) {
      whereClause.AND.push({ date: { lte: new Date(toDateStr) } });
    }
    if (searchStr) {
      whereClause.AND.push({ description: { contains: searchStr } });
    }

    // Fetch data directly from database using Prisma
    const clientAccountData = await prisma.clientAccountStatement.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true,
            nationalId: true,
            city: true,
            address: true,
            createdAt: true
          }
        },
        entries: {
          where: whereClause.AND.length > 0 ? whereClause : {},
          orderBy: { date: 'asc' }
        }
      }
    });

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
