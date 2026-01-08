import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { field, value } = req.query;

    if (!field || !value) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (field !== 'phonenumber' && field !== 'visaNumber') {
      return res.status(400).json({ error: 'Invalid field parameter' });
    }

    let clientId = null;

    if (field === 'phonenumber') {
      const client = await prisma.client.findFirst({
        where: {
          phonenumber: value as string,
        },
        select: {
          id: true,
        },
      });
      
      if (client) {
        clientId = client.id;
      }
    } else if (field === 'visaNumber') {
      // البحث في جدول visa عن رقم التأشيرة
      const visa = await prisma.visa.findFirst({
        where: {
          visaNumber: value as string,
        },
        select: {
          clientID: true,
        },
      });
      
      if (visa && visa.clientID) {
        clientId = visa.clientID;
      }
    }

    if (clientId) {
      return res.status(200).json({
        exists: true,
        clientId: clientId,
      });
    }

    return res.status(200).json({
      exists: false,
      clientId: null,
    });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

