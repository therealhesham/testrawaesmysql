import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { client, date, search, contractType } = req.query;

    // Build where clause for filtering
    const where: any = {};

    if (client) {
      where.client = {
        fullname: { contains: client as string }
      };
    }

    if (date) {
      where.createdAt = {
        gte: new Date(date as string),
        lt: new Date(new Date(date as string).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    if (search) {
      where.OR = [
        { contractNumber: { contains: search as string } },
        { officeName: { contains: search as string } },
        { client: { fullname: { contains: search as string } } }
      ];
    }

    if (contractType) {
      where.order = {
        typeOfContract: contractType as string
      };
    }

    // Fetch client account statements
    const statements = await prisma.clientAccountStatement.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true
          }
        },
        entries: {
          select: {
            debit: true,
            credit: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform data to settlement format
    const settlements = statements.map(statement => {
      // Calculate totals from entries
      const totalPaid = statement.entries
        .filter(entry => Number(entry.credit) > 0)
        .reduce((sum, entry) => sum + Number(entry.credit), 0);
      
      const totalExpenses = statement.entries
        .filter(entry => Number(entry.debit) > 0)
        .reduce((sum, entry) => sum + Number(entry.debit), 0);

      const netAmount = totalPaid - totalExpenses;

      return {
        id: statement.id,
        clientName: statement.client?.fullname || 'غير محدد',
        contractNumber: statement.contractNumber || `#${statement.id}`,
        contractValue: statement.totalRevenue || 0,
        totalPaid: totalPaid,
        totalExpenses: totalExpenses,
        netAmount: netAmount,
        lastUpdated: statement.updatedAt.toISOString().split('T')[0]
      };
    });

    // Calculate summary
    const summary = {
      totalContracts: settlements.length,
      totalContractValue: settlements.reduce((sum, s) => sum + Number(s.contractValue), 0),
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
