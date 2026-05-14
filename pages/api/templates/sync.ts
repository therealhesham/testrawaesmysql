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
    
    // محاولة تشغيل السكربت (اختياري في السيرفر)
    try {
      const { execSync } = require('child_process');
      const scriptPath = path.resolve(process.cwd(), 'lib/templates/generate_templates.js');
      if (fs.existsSync(scriptPath)) {
        execSync(`node "${scriptPath}"`);
      }
    } catch (e) {}

    // البحث عن ملف القوالب في عدة مسارات محتملة للإنتاج
    const possiblePaths = [
      path.join(process.cwd(), 'lib/templates/default_templates.json'),
      path.join(process.cwd(), '.next/server/lib/templates/default_templates.json'),
      path.resolve('./lib/templates/default_templates.json')
    ];

    let fileContent = null;
    let foundPath = '';

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        fileContent = fs.readFileSync(p, 'utf8');
        foundPath = p;
        break;
      }
    }

    // إذا فشل البحث في الملفات، نحاول استخدام require كحل أخير (يساعد في بيئات Vercel)
    let defaultTemplates;
    if (fileContent) {
      defaultTemplates = JSON.parse(fileContent);
    } else {
      try {
        // نستخدم require مع مسار نسبي من ملف الـ API
        defaultTemplates = require('../../../lib/templates/default_templates.json');
        console.log('Found templates using require');
      } catch (requireError) {
        return res.status(404).json({ 
          error: 'تعذر العثور على ملف القوالب في السيرفر بكافة الطرق',
          checkedPaths: possiblePaths,
          cwd: process.cwd()
        });
      }
    }

    const results = [];
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
  } catch (error: any) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'فشلت المزامنة: ' + error.message });
  }
}
