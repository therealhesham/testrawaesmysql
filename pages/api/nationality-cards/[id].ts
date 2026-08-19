import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { countryArabic, countryEnglish, flagUrl, price, oldPrice, sortOrder, isActive } = req.body;
      
      await prisma.$executeRawUnsafe(`
        UPDATE NationalityCard 
        SET countryArabic = ?, countryEnglish = ?, flagUrl = ?, price = ?, oldPrice = ?, sortOrder = ?, isActive = ?
        WHERE id = ?
      `, countryArabic, countryEnglish, flagUrl, price, oldPrice || null, sortOrder, isActive, parseInt(id as string, 10));
      
      return res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update nationality card' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM NationalityCard WHERE id = ?`, parseInt(id as string, 10));
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to delete nationality card' });
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
