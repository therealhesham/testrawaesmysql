import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ success: false, error: 'رقم الطلب مطلوب' });
  }

  const parsedOrderId = parseInt(orderId as string, 10);

  if (req.method === 'GET') {
    try {
      const order = await prisma.neworder.findUnique({
        where: { id: parsedOrderId },
        select: { communicationNotes: true } as any
      }) as any;

      if (!order) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      }

      return res.status(200).json({
        success: true,
        notes: order.communicationNotes || []
      });
    } catch (error) {
      console.error('Error fetching order notes:', error);
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب الملاحظات' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { text, username } = req.body;

      if (!text || !username) {
        return res.status(400).json({ success: false, error: 'النص واسم المستخدم مطلوبان' });
      }

      const order = await prisma.neworder.findUnique({
        where: { id: parsedOrderId },
        select: { communicationNotes: true } as any
      }) as any;

      if (!order) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
      }

      // Ensure notes is an array
      let notesArray: any[] = [];
      if (Array.isArray(order.communicationNotes)) {
        notesArray = order.communicationNotes;
      } else if (order.communicationNotes) {
        notesArray = [order.communicationNotes];
      }

      const newNote = {
        text,
        user: username,
        date: new Date().toISOString()
      };

      notesArray.push(newNote);

      await prisma.neworder.update({
        where: { id: parsedOrderId },
        data: {
          communicationNotes: notesArray
        } as any
      });

      return res.status(200).json({
        success: true,
        message: 'تم إضافة الملاحظة بنجاح',
        notes: notesArray
      });
    } catch (error) {
      console.error('Error adding order note:', error);
      return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إضافة الملاحظة' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
