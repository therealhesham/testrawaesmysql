import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

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

  if (req.method === 'PUT') {
    try {
      const { country, name, stages, isActive } = req.body;

      const updateData: any = {};
      if (country) updateData.country = country;
      if (name !== undefined) updateData.name = name;
      if (stages) updateData.stages = stages;
      if (isActive !== undefined) updateData.isActive = isActive;

      const timeline = await prisma.customTimeline.update({
        where: { id: Number(id) },
        data: updateData,
      });

      return res.status(200).json(timeline);
    } catch (error: any) {
      console.error('Error updating custom timeline:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Timeline not found' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.customTimeline.delete({
        where: { id: Number(id) },
      });

      return res.status(200).json({ message: 'Timeline deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting custom timeline:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Timeline not found' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const timeline = await prisma.customTimeline.findUnique({
        where: { id: Number(id) },
      });

      if (!timeline) {
        return res.status(404).json({ error: 'Timeline not found' });
      }

      return res.status(200).json(timeline);
    } catch (error) {
      console.error('Error fetching custom timeline:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

