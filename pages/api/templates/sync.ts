import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = jwtDecode(cookies.authToken) as any;
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const hasPermission = findUser && findUser.role?.permissions && (findUser.role.permissions as any)["إدارة القوالب"]?.["إضافة"];
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    console.log('Start synchronizing templates...');
    
    // أولاً: تشغيل سكربت توليد القوالب لتحديث ملف JSON من المسار الجديد
    const { execSync } = require('child_process');
    try {
      console.log('Running generate_templates script...');
      execSync('node lib/templates/generate_templates.js');
    } catch (execError) {
      console.error('Error running generate_templates:', execError);
      // نكمل المزامنة حتى لو فشل السكربت (سيستخدم آخر نسخة ناجحة)
    }

    const results = [];
    // نقرأ النسخة المحدثة من الملف مباشرة من المجلد الجديد
    const filePath = path.join(process.cwd(), 'lib', 'templates', 'default_templates.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const defaultTemplates = JSON.parse(fileContent);

    for (const t of defaultTemplates) {
      const existing = await prisma.template.findFirst({ where: { title: t.title } });
      if (existing) {
        await prisma.template.update({
          where: { id: existing.id },
          data: {
            content: t.content,
            dynamicFields: JSON.stringify(t.dynamicFields)
          }
        });
        results.push({ title: t.title, status: 'updated' });
      } else {
        await prisma.template.create({
          data: {
            title: t.title,
            type: t.type,
            content: t.content,
            dynamicFields: JSON.stringify(t.dynamicFields)
          }
        });
        results.push({ title: t.title, status: 'created' });
      }
    }

    res.status(200).json({ message: 'Synchronization successful', results });
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Failed to synchronize templates' });
  }
}
