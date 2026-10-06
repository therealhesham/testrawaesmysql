import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [orders, transfers] = await Promise.all([
      prisma.neworder.findMany({
        where: {
          orderDocument: { not: null },
          clientAccountStatement: { some: {} }
        },
        include: {
          client: true,
          clientAccountStatement: {
            include: {
              entries: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transferSponsorShips.findMany({
        where: {
          promissoryNoteFile: { not: null }
        },
        include: {
          NewClient: true,
          OldClient: true,
          HomeMaid: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Fetch matching clientAccountStatements for transfers
    const transferContractNumbers = transfers.map(t => `TRF-${t.id}`);
    const transferStatements = await prisma.clientAccountStatement.findMany({
      where: {
        contractNumber: { in: transferContractNumbers }
      },
      include: {
        entries: true
      }
    });

    const stmtMap = new Map<string, typeof transferStatements[0]>();
    for (const s of transferStatements) {
      if (s.contractNumber) {
        stmtMap.set(s.contractNumber, s);
      }
    }

    const formattedTransfers = transfers
      .filter((t) => t.promissoryNoteFile && t.promissoryNoteFile.trim() !== '' && t.promissoryNoteFile !== 'عرض' && t.promissoryNoteFile !== 'غير متوفر')
      .map((t) => {
        let totalCost = Number(t.Cost || 0);
        let totalPaid = Number(t.Paid || 0);
        let remaining = Math.max(0, totalCost - totalPaid);

        const stmt = stmtMap.get(`TRF-${t.id}`);
        if (stmt) {
          if (stmt.entries && stmt.entries.length > 0) {
            const sumDebit = stmt.entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
            const sumCredit = stmt.entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
            totalCost = sumDebit > 0 ? sumDebit : totalCost;
            totalPaid = sumCredit;
            remaining = Math.max(0, totalCost - totalPaid);
          } else {
            totalCost = Number(stmt.totalRevenue || 0) || totalCost;
            totalPaid = Number(stmt.totalExpenses || 0) || totalPaid;
            remaining = Math.max(0, totalCost - totalPaid);
          }
        }

        return {
          id: t.id,
          type: 'transfer',
          title: `معاملة نقل كفالة #${t.id}`,
          link: `/admin/AddTransactionForm?id=${t.id}&mode=view`,
          bookingstatus: t.transferStage || 'تم نقل الكفالة',
          orderDocument: t.promissoryNoteFile,
          createdAt: t.createdAt,
          client: t.NewClient ? {
            id: t.NewClient.id,
            fullname: t.NewClient.fullname,
            phonenumber: t.NewClient.phonenumber || t.NewClient.alternativePhone || 'غير متوفر',
            city: t.NewClient.city,
          } : null,
          isTransfer: true,
          financial: {
            totalCost,
            totalPaid,
            remaining,
          }
        };
      });

    const formattedOrders = orders.map((order) => ({
      ...order,
      type: 'order',
      title: `طلب #${order.id}`,
      link: `/admin/track_order/${order.id}`,
      isTransfer: false,
    }));

    const combined = [...formattedOrders, ...formattedTransfers].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.status(200).json(combined);
  } catch (error) {
    console.error('Error fetching orders with promissory notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

