import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication check
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = jwtDecode(cookies.authToken) as any;
  const user = await prisma.user.findUnique({
    where: { id: Number(token.id) },
    include: { role: true },
  });

  if (!user || user.roleId !== 1) {
    return res.status(403).json({ error: 'Forbidden - Admin only' });
  }

  if (req.method === 'GET') {
    try {
      const timelines = await prisma.customTimeline.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ items: timelines });
    } catch (error) {
      console.error('Error fetching custom timelines:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { country, name, stages, isActive } = req.body;

      if (!country || !stages || !Array.isArray(stages)) {
        return res.status(400).json({ error: 'Country and stages are required' });
      }

      const timeline = await prisma.customTimeline.create({
        data: {
          country,
          name: name || null,
          stages: stages,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return res.status(201).json(timeline);
    } catch (error: any) {
      console.error('Error creating custom timeline:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Timeline for this country already exists' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

