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
        `SELECT settingKey, settingValue FROM website_settings WHERE settingKey IN ('hero_banner_image', 'hero_banner_show_border', 'hero_banner_images', 'hero_banner_auto_slide', 'hero_banner_interval', 'hero_banner_intervals')`
      );

      let bannerUrl = '/banner.png';
      let showBorder = true;
      let customBanners: string[] = [];
      let autoSlide = true;
      let slideInterval = 4000;
      let slideIntervals: number[] = [];

      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (r.settingKey === 'hero_banner_image' && r.settingValue) {
            bannerUrl = r.settingValue;
          }
          if (r.settingKey === 'hero_banner_show_border') {
            showBorder = r.settingValue === 'true' || r.settingValue === '1';
          }
          if (r.settingKey === 'hero_banner_auto_slide') {
            autoSlide = r.settingValue === 'true' || r.settingValue === '1';
          }
          if (r.settingKey === 'hero_banner_interval' && r.settingValue) {
            const parsed = parseInt(r.settingValue, 10);
            if (!isNaN(parsed) && parsed >= 500) slideInterval = parsed;
          }
          if (r.settingKey === 'hero_banner_intervals' && r.settingValue) {
            try {
              const parsed = JSON.parse(r.settingValue);
              if (Array.isArray(parsed)) {
                slideIntervals = parsed.map(Number).filter(n => !isNaN(n) && n >= 500);
              }
            } catch (e) {
              console.error('Error parsing hero_banner_intervals:', e);
            }
          }
          if (r.settingKey === 'hero_banner_images' && r.settingValue) {
            try {
              const parsed = JSON.parse(r.settingValue);
              if (Array.isArray(parsed) && parsed.length > 0) {
                customBanners = parsed;
              }
            } catch (e) {
              console.error('Error parsing hero_banner_images:', e);
            }
          }
        }
      }

      let allBanners: string[] = [];
      if (customBanners.length > 0) {
        allBanners = customBanners;
      } else {
        const historyRows: any = await prisma.$queryRawUnsafe(
          `SELECT imageUrl FROM website_banner_history ORDER BY id DESC`
        );
        const historyUrls = Array.isArray(historyRows) ? historyRows.map((h: any) => h.imageUrl).filter(Boolean) : [];
        allBanners = Array.from(new Set([bannerUrl, ...historyUrls, '/banner.png'].filter(Boolean)));
      }

      return res.status(200).json({ 
        heroBannerUrl: bannerUrl, 
        heroBannerUrls: allBanners, 
        showBorder,
        autoSlide,
        slideInterval,
        slideIntervals
      });
    } catch (error) {
      console.error('Failed to fetch website settings:', error);
      return res.status(200).json({ 
        heroBannerUrl: '/banner.png', 
        heroBannerUrls: ['/banner.png'], 
        showBorder: true,
        autoSlide: true,
        slideInterval: 4000
      });
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
