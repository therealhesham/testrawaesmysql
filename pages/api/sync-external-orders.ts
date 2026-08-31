import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { sendOrderNotifications } from '../../lib/notificationsHelper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // جلب الطلبات التي تم إنشاؤها خلال الـ 24 ساعة الماضية
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentOrders = await prisma.neworder.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        bookingstatus: { in: ['new_order', 'pending_external_office'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    let sentCount = 0;

    for (const order of recentOrders) {
      // التحقق من وجود إشعار مسبق لهذا الطلب في قاعدة البيانات
      const notifExists = await prisma.notifications.findFirst({
        where: {
          message: { contains: `(رقم ${order.id})` },
          type: 'new_order'
        }
      });

      // إذا لم يتم إرسال الإشعار مسبقاً، أرسله الآن
      if (!notifExists) {
        console.log(`[Sync] Sending missing notifications for external order ${order.id}`);
        await sendOrderNotifications(
          order.id,
          order.ClientName || "عميل خارجي",
          order.HomemaidId || "",
          (res.socket as any)?.server?.io
        ).catch(e => console.error(`[Sync] Failed to send notif for order ${order.id}`, e));
        
        sentCount++;
      }
    }

    return res.status(200).json({ success: true, checkedOrders: recentOrders.length, sentEmails: sentCount });
  } catch (error: any) {
    console.error("Error in sync-external-orders:", error);
    return res.status(500).json({ error: error.message });
  }
}
