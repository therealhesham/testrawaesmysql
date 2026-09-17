import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure table exists
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS website_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settingKey VARCHAR(100) UNIQUE,
        settingValue LONGTEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error('Error ensuring website_settings table:', err);
  }

  if (req.method === 'GET') {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT settingKey, settingValue FROM website_settings WHERE settingKey IN ('hero_banner_image', 'hero_banner_show_border')`
      );

      let bannerUrl = '/banner.png';
      let showBorder = true;

      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          if (r.settingKey === 'hero_banner_image' && r.settingValue) {
            bannerUrl = r.settingValue;
          }
          if (r.settingKey === 'hero_banner_show_border') {
            showBorder = r.settingValue === 'true' || r.settingValue === '1';
          }
        });
      }

      return res.status(200).json({ heroBannerUrl: bannerUrl, showBorder });
    } catch (error) {
      console.error('Failed to fetch website settings:', error);
      return res.status(200).json({ heroBannerUrl: '/banner.png', showBorder: true });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { heroBannerUrl, showBorder } = req.body;
      const urlToSave = heroBannerUrl !== undefined ? heroBannerUrl.trim() : '/banner.png';
      const borderToSave = showBorder !== undefined ? (showBorder ? '1' : '0') : '1';

      await prisma.$executeRawUnsafe(
        `INSERT INTO website_settings (settingKey, settingValue) 
         VALUES ('hero_banner_image', ?) 
         ON DUPLICATE KEY UPDATE settingValue = ?`,
        urlToSave,
        urlToSave
      );

      await prisma.$executeRawUnsafe(
        `INSERT INTO website_settings (settingKey, settingValue) 
         VALUES ('hero_banner_show_border', ?) 
         ON DUPLICATE KEY UPDATE settingValue = ?`,
        borderToSave,
        borderToSave
      );

      return res.status(200).json({ 
        success: true, 
        heroBannerUrl: urlToSave,
        showBorder: borderToSave === '1'
      });
    } catch (error) {
      console.error('Failed to save website settings:', error);
      return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الإعدادات' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
