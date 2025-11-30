import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // التحقق من التوثيق
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const token = jwtDecode(authToken) as any;
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق إذا كان المستخدم IT
    const isITUser = user.role?.name?.toLowerCase().includes('it') || 
                     user.role?.name?.toLowerCase().includes('تقنية') ||
                     user.role?.name?.toLowerCase().includes('نظم');

    if (!isITUser) {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل الشكاوى' });
    }

    const { id, status, resolutionNotes, assignedToId } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'معرف الشكوى مطلوب' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (assignedToId) updateData.assignedToId = assignedToId;
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const complaint = await prisma.complaint.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            pictureurl: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            pictureurl: true,
          }
        }
      }
    });

    return res.status(200).json({ success: true, complaint });
  } catch (error: any) {
    console.error('Error updating complaint:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء تحديث الشكوى' });
  }
}

