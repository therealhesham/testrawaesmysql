import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure table exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS website_banner_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        imageUrl VARCHAR(500) NOT NULL UNIQUE,
        fileName VARCHAR(255) NULL,
        createdAt DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);
  } catch (err) {
    console.error('Error ensuring website_banner_history table:', err);
  }

  if (req.method === 'GET') {
    try {
      const history: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM website_banner_history ORDER BY createdAt DESC`
      );
      return res.status(200).json(history || []);
    } catch (error) {
      console.error('Failed to fetch banner history:', error);
      return res.status(200).json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { imageUrl, fileName } = req.body;
      if (!imageUrl || imageUrl === '/banner.png') {
        return res.status(400).json({ error: 'رابط الصورة مطلوب' });
      }

      await prisma.$executeRawUnsafe(
        `INSERT IGNORE INTO website_banner_history (imageUrl, fileName) VALUES (?, ?)`,
        imageUrl,
        fileName || null
      );

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Failed to add banner to history:', error);
      return res.status(500).json({ error: 'حدث خطأ أثناء إضافة الصورة للسجل' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id, imageUrl } = req.query;
      if (id) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM website_banner_history WHERE id = ?`,
          Number(id)
        );
      } else if (imageUrl) {
        await prisma.$executeRawUnsafe(
          `DELETE FROM website_banner_history WHERE imageUrl = ?`,
          imageUrl as string
        );
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Failed to delete banner from history:', error);
      return res.status(500).json({ error: 'حدث خطأ أثناء حذف الصورة من السجل' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
