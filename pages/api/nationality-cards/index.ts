import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const cards = await prisma.$queryRawUnsafe(`SELECT * FROM NationalityCard ORDER BY sortOrder ASC`);
      return res.status(200).json(cards);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch nationality cards' });
    }
  } else if (req.method === 'POST') {
    try {
      const { countryArabic, countryEnglish, flagUrl, price, oldPrice, sortOrder, isActive } = req.body;
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO NationalityCard (countryArabic, countryEnglish, flagUrl, price, oldPrice, sortOrder, isActive)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, countryArabic, countryEnglish, flagUrl, price, oldPrice || null, sortOrder || 0, isActive === undefined ? true : isActive);
      
      return res.status(201).json({ message: 'Created successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create nationality card' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
