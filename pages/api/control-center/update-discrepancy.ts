import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { orderId, type, newValue, userId, username } = req.body;
    
    if (!orderId || !type || newValue === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const order = await prisma.neworder.findUnique({
      where: { id: orderId },
      include: {
        arrivals: true,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (type === 'nationalId') {
      if (!order.clientID) throw new Error('لا يوجد عميل مرتبط بهذا الطلب');
      await prisma.$transaction([
        prisma.client.update({
          where: { id: order.clientID },
          data: { nationalId: newValue }
        }),
        prisma.neworder.update({
          where: { id: orderId },
          data: { nationalId: newValue }
        })
      ]);
    } else if (type === 'nationality') {
      if (!order.HomemaidId) throw new Error('لا توجد عاملة مرتبطة بهذا الطلب');
      // Update Nationalitycopy, which is the standard string field used in the UI
      await prisma.homemaid.update({
        where: { id: order.HomemaidId },
        data: { Nationalitycopy: newValue }
      });
    } else if (type === 'contractDate' || type === 'startDate') {
      if (!order.arrivals || order.arrivals.length === 0) throw new Error('لا توجد بيانات وصول مرتبطة بهذا الطلب');
      
      const newDate = new Date(newValue);
      if (isNaN(newDate.getTime())) {
        throw new Error('تاريخ غير صالح');
      }

      await prisma.arrivallist.update({
        where: { id: order.arrivals[0].id },
        data: { DateOfApplication: newDate }
      });
    } else {
      return res.status(400).json({ error: 'Invalid discrepancy type' });
    }

    let fieldNameAr = '';
    if (type === 'nationalId') fieldNameAr = 'هوية صاحب العمل';
    else if (type === 'nationality') fieldNameAr = 'جنسية العاملة';
    else if (type === 'contractDate' || type === 'startDate') fieldNameAr = 'تاريخ العقد';
    else fieldNameAr = type;

    try {
      await prisma.systemUserLogs.create({
        data: {
          actionType: `تحديث مطابقة مساند`,
          action: `مطابقة مساند - تحديث ${fieldNameAr} للطلب رقم #${orderId}`,
          beneficiary: username || 'مركز الرقابة',
          BeneficiaryId: order.HomemaidId ? Number(order.HomemaidId) : null,
          pageRoute: 'admin/control-center',
          details: `تم تحديث ${fieldNameAr} إلى: ${newValue}`,
          userId: userId ? Number(userId) : 4,
        }
      });
    } catch (logErr) {
      console.error('Failed to create log:', logErr);
    }

    return res.status(200).json({ success: true, message: 'تم التحديث بنجاح' });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء التحديث' });
  }
}
