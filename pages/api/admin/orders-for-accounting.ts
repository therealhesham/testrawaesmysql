import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Fetch orders that are approved or have a Total amount
    const orders: any[] = await (prisma as any).neworder.findMany({
      where: {
        Total: {
          not: null,
        },
        AmountWithoutTax: {
          not: null,
        },
        TaxAmount: {
          not: null,
        },
        bookingstatus: {
          notIn: ['cancelled', 'rejected', 'ملغي', 'ملغى', 'مرفوض'],
        },
      },
      select: {
        id: true,
        ClientName: true,
        Total: true,
        AmountWithoutTax: true,
        TaxAmount: true,
        contract: true,
        bookingstatus: true,
        isJournalPosted: true,
        daftraJournalId: true,
        journalPostedAt: true,
        createdAt: true,
        arrivals: {
          select: {
            InternalmusanedContract: true,
            ExternalDateLinking: true
          }
        },
        client: {
          select: {
            id: true,
            fullname: true
          }
        },
        HomeMaid: {
          select: {
            officeName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 for performance
    });

    const formattedOrders = orders.map((order: any) => ({
      ...order,
      ClientName: order.ClientName || order.client?.fullname || 'غير محدد',
      officeName: order.HomeMaid?.officeName || ''
    }));

    res.status(200).json(formattedOrders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
