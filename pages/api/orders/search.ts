import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { search, limit = '10' } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = parseInt(limit as string);

    // Search orders by ID, client name, or phone number
    const orders = await prisma.neworder.findMany({
      where: {
        OR: [
          { id: parseInt(search) || undefined },
          { ClientName: { contains: search } },
          { PhoneNumber: { contains: search } },
          { clientphonenumber: { contains: search } }
        ],
        isHidden: false // Only show non-hidden orders
      },
      include: {
        client: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true
          }
        },
        HomeMaid: {
          select: {
            id: true,
            Name: true,
            Nationalitycopy: true,
            Nationality: true
          }
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      clientName: order.ClientName || order.client?.fullname || 'غير محدد',
      clientId: order.clientID,
      phoneNumber: order.PhoneNumber || order.clientphonenumber,
      maidName: order.Name || order.HomeMaid?.Name || 'غير محدد',
      maidNationality: order.Nationalitycopy || order.HomeMaid?.Nationalitycopy || 'غير محدد',
      maidId: order.HomemaidId,
      bookingStatus: order.bookingstatus,
      profileStatus: order.profileStatus,
      createdAt: order.createdAt
    }));

    res.status(200).json({
      orders: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
