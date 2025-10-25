import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

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
