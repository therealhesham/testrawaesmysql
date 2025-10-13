import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { clientId, notes, notesDate } = req.body;

    // التحقق من صحة البيانات
    if (!clientId || !notes || !notesDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'جميع الحقول مطلوبة' 
      });
    }

    // التحقق من وجود العميل
    const client = await prisma.client.findUnique({
      where: { id: parseInt(clientId) }
    });

    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'العميل غير موجود' 
      });
    }

    // تحديث ملاحظات العميل
    const updatedClient = await prisma.notes.create({
      // where: { id: parseInt(clientId) },
      data: {
        notes: notes,
        clientID: parseInt(clientId),
        
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'تم حفظ الملاحظة بنجاح',
      client: updatedClient
    });

  } catch (error) {
    console.error('Error updating client notes:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'حدث خطأ أثناء حفظ الملاحظة' 
    });
  }
}
