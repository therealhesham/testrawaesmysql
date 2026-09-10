import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const nonCashMethods = [
      'two-installments',
      'three-installments',
      'custom',
      'دفعتين',
      'دفعتان',
      'ثلاثة دفعات',
      'ثلاث دفعات',
      'مخصص',
      'قسط',
      'أقساط',
    ];

    // Fetch orders that are approved or have a Total amount and are Cash / Full payment only
    const orders: any[] = await (prisma as any).neworder.findMany({
      where: {
        Total: {
          not: null,
          gt: 0,
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
        OR: [
          { PaymentMethod: null },
          { PaymentMethod: { notIn: nonCashMethods } },
        ],
      },
      select: {
        id: true,
        ClientName: true,
        Total: true,
        paid: true,
        AmountWithoutTax: true,
        TaxAmount: true,
        PaymentMethod: true,
        Installments: true,
        contract: true,
        bookingstatus: true,
        isJournalPosted: true,
        daftraJournalId: true,
        journalPostedAt: true,
        createdAt: true,
        arrivals: {
          select: {
            InternalmusanedContract: true,
            ExternalDateLinking: true,
          },
        },
        client: {
          select: {
            id: true,
            fullname: true,
          },
        },
        HomeMaid: {
          select: {
            officeName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 for performance
    });

    // In-memory filter as an extra safeguard
    const filteredOrders = orders.filter((order: any) => {
      const pm = String(order.PaymentMethod || '').trim().toLowerCase();
      if (nonCashMethods.includes(pm)) return false;
      if (order.Installments != null && Number(order.Installments) > 1) return false;
      return true;
    });

    const formattedOrders = filteredOrders.map((order: any) => ({
      ...order,
      ClientName: order.ClientName || order.client?.fullname || 'غير محدد',
      officeName: order.HomeMaid?.officeName || '',
    }));

    res.status(200).json(formattedOrders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
