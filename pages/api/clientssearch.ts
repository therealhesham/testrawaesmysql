import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    // Search for clients
    case 'GET':
      try {
        const { query } = req.query;
        if (!query || typeof query !== 'string') {
          return res.status(400).json({ error: 'Query parameter is required' });
        }

        const clients = await prisma.client.findMany({
          where: {
            OR: [
              { fullname: { contains: query } },
              { phonenumber: { contains: query } },
              { nationalId: { contains: query } },
              { city: { contains: query } },
            ],
          },
          select: {
            id: true,
            fullname: true,
            phonenumber: true,
            nationalId: true,
            city: true,
          },
          take: 10, // Limit to 10 results for performance
        });

        return res.status(200).json(clients);
      } catch (error) {
        console.error('Error searching clients:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    // Create a new client
    case 'POST':
      try {
        const { fullname, phonenumber, nationalId, city } = req.body;

        if (!fullname || !phonenumber || !nationalId) {
          return res.status(400).json({ error: 'الاسم، رقم الهاتف، ورقم الهوية مطلوبين' });
        }

        const client = await prisma.client.create({
          data: {
            fullname,
            phonenumber,
            nationalId,
            city,
          },
          select: {
            id: true,
            fullname: true,
            phonenumber: true,
            nationalId: true,
            city: true,
          },
        });

        return res.status(201).json(client);
      } catch (error) {
        console.error('Error creating client:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `الطريقة ${method} غير مدعومة` });
  }
}