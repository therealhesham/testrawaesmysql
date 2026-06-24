import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workerId, clientId } = req.body;

    if (!workerId || !clientId) {
      return res.status(400).json({ error: 'Worker ID and Client ID are required' });
    }

    // Check if worker is already booked
    const existingOrder = await prisma.neworder.findFirst({
      where: {
        HomemaidId: parseInt(workerId),
        // NOT: {
        //   bookingstatus: {
        //     in: ['delivered', 'rejected', 'cancelled']
        //   }
        // }
      }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'العاملة محجوزة بالفعل' });
    }

    // Reactivate if medically unfit
    const targetMaid = await prisma.homemaid.findUnique({
      where: { id: parseInt(workerId) }
    });
    if (targetMaid && (targetMaid.bookingstatus === 'غير لائقة طبيا' || targetMaid.bookingstatus === 'غير لائقة طبياً')) {
      await prisma.homemaid.update({
        where: { id: parseInt(workerId) },
        data: {
          bookingstatus: '',
          isApproved: true,
        }
      });
      
      let userName = 'system';
      try {
        const cookieHeader = req.headers.cookie;
        let cookies: { [key: string]: string } = {};
        if (cookieHeader) {
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
        }
        const decoded = cookies.authToken ? jwtDecode(cookies.authToken) as any : null;
        userName = decoded?.username || userName;
      } catch (_) {}

      await prisma.logs.create({
        data: {
          Status: 'إعادة تنشيط تلقائي',
          Details: `تمت إعادة تنشيط العاملة تلقائياً عند ربطها بالطلب الجديد بعد فشل فحصها الطبي السابق`,
          userId: userName,
          homemaidId: parseInt(workerId),
        }
      });
    }

    // Create new booking
    const booking = await prisma.neworder.create({
      data: {
        HomemaidId: parseInt(workerId),
        clientID: parseInt(clientId),
        typeOfContract: 'recruitment', // Default to rental
        bookingstatus: 'pending_external_office',
        createdAt: new Date()
      
      }
    }
  
  );

try {
  await prisma.logs.create({
    data: {
      Details: 'تم حجز العاملة ' + workerId,
      homemaidId: parseInt(workerId),
      userId: 'system',
      Status: 'حجز جديد'
    }
  })
} catch (error) {

console.error('Error creating log:', error);

}
    return res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
