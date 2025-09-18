import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { client, date, search } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (client) {
      where.clientName = { contains: client as string };
    }

    if (date) {
      where.orderDate = {
        gte: new Date(date as string),
        lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search as string } },
        { orderNumber: { contains: search as string } },
        { transferNumber: { contains: search as string } }
      ];
    }

    // Fetch financial records from MusanadFinancialRecord
    const financialRecords = await prisma.musanadFinancialRecord.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true
          }
        },
        order: {
          select: {
            id: true,
            Total: true,
            Payments: {
              select: {
                Paid: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform data to settlement format
    const settlements = financialRecords.map(record => {
      // Calculate total paid from order payments
      const totalPaid = record.order?.Payments?.reduce((sum, payment) => 
        sum + parseFloat(payment.Paid.toString()), 0) || 0;

      // Get contract value from order total or revenue
      const contractValue = record.order?.Total ? 
        parseFloat(record.order.Total.toString()) : 
        parseFloat(record.revenue.toString());

      return {
        id: record.id,
        clientName: record.clientName,
        contractNumber: record.orderNumber || record.transferNumber,
        contractValue: contractValue,
        totalPaid: totalPaid,
        totalExpenses: parseFloat(record.expenses.toString()),
        netAmount: parseFloat(record.netAmount.toString()),
        lastUpdated: record.updatedAt.toISOString().split('T')[0]
      };
    });

    // Calculate summary
    const summary = {
      totalContracts: settlements.length,
      totalContractValue: settlements.reduce((sum, s) => sum + s.contractValue, 0),
      totalPaid: settlements.reduce((sum, s) => sum + s.totalPaid, 0),
      totalExpenses: settlements.reduce((sum, s) => sum + s.totalExpenses, 0),
      totalNet: settlements.reduce((sum, s) => sum + s.netAmount, 0)
    };

    return res.status(200).json({
      settlements,
      summary
    });

  } catch (error) {
    console.error('Error fetching settlement data:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
