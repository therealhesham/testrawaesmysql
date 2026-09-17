import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_STATS = {
  showSection: true,
  sectionTitle: "إحصائياتنا",
  items: [
    {
      id: 1,
      number: 1000,
      prefix: "+",
      label: "عدد عملائنا السعداء",
      highlightWord: "عملائنا",
      icon: "users"
    },
    {
      id: 2,
      number: 1000,
      prefix: "+",
      label: "عدد العقود المنجزة",
      highlightWord: "العقود",
      icon: "contracts"
    },
    {
      id: 3,
      number: 600,
      prefix: "+",
      label: "عدد العاملات المتميزات المتاحات",
      highlightWord: "العاملات",
      icon: "badge"
    }
  ]
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure tables exist
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS website_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        settingKey VARCHAR(100) UNIQUE,
        settingValue LONGTEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS website_banner_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        imageUrl VARCHAR(500) NOT NULL UNIQUE,
        fileName VARCHAR(255) NULL,
        createdAt DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3)
      )
    `);
  } catch (err) {
    console.error('Error ensuring tables:', err);
  }

  if (req.method === 'GET') {
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT settingKey, settingValue FROM website_settings WHERE settingKey IN ('hero_banner_image', 'hero_banner_show_border', 'website_stats')`
      );

      let bannerUrl = '/banner.png';
      let showBorder = true;
      let websiteStats = DEFAULT_STATS;

      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          if (r.settingKey === 'hero_banner_image' && r.settingValue) {
            bannerUrl = r.settingValue;
          }
          if (r.settingKey === 'hero_banner_show_border') {
            showBorder = r.settingValue === 'true' || r.settingValue === '1';
          }
          if (r.settingKey === 'website_stats' && r.settingValue) {
            try {
              websiteStats = JSON.parse(r.settingValue);
            } catch (pErr) {
              console.error('Error parsing website_stats JSON:', pErr);
            }
          }
        });
      }

      return res.status(200).json({ heroBannerUrl: bannerUrl, showBorder, stats: websiteStats });
    } catch (error) {
      console.error('Failed to fetch website settings:', error);
      return res.status(200).json({ heroBannerUrl: '/banner.png', showBorder: true, stats: DEFAULT_STATS });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { heroBannerUrl, showBorder, stats } = req.body;

      if (heroBannerUrl !== undefined || showBorder !== undefined) {
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

        // Auto-insert to history if it's an uploaded image URL
        if (urlToSave && urlToSave !== '/banner.png') {
          try {
            await prisma.$executeRawUnsafe(
              `INSERT IGNORE INTO website_banner_history (imageUrl) VALUES (?)`,
              urlToSave
            );
          } catch (histErr) {
            console.error('Error inserting into history:', histErr);
          }
        }
      }

      if (stats !== undefined) {
        const statsJson = typeof stats === 'string' ? stats : JSON.stringify(stats);
        await prisma.$executeRawUnsafe(
          `INSERT INTO website_settings (settingKey, settingValue) 
           VALUES ('website_stats', ?) 
           ON DUPLICATE KEY UPDATE settingValue = ?`,
          statsJson,
          statsJson
        );
      }

      return res.status(200).json({ 
        success: true, 
        heroBannerUrl: heroBannerUrl !== undefined ? heroBannerUrl.trim() : undefined,
        showBorder: showBorder !== undefined ? showBorder : undefined,
        stats: stats !== undefined ? stats : undefined
      });
    } catch (error) {
      console.error('Failed to save website settings:', error);
      return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الإعدادات' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
