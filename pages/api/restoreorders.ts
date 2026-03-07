// pages/api/restoreorders.ts
// مسار عكسي للرفض والإلغاء: نشيل السجل من rejected/cancelled ونرجع الطلب لـ new_order مع إعادة ربط العاملة
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  try {
    const { id } = req.body;
    const orderId = Number(id);

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ error: "معرف الطلب مطلوب" });
    }

    // جلب الطلب مع السجلات المرتبطة (rejected أو cancelled)
    const order = await prisma.neworder.findUnique({
      where: { id: orderId },
      include: {
        rejectedOrders: true,
        cancelledOrders: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }

    const status = (order.bookingstatus || "").toLowerCase();
    const isRejected = status === "rejected" || status === "طلب مرفوض";
    const isCancelled = status === "cancelled" || status === "عقد ملغي";

    if (!isRejected && !isCancelled) {
      return res.status(400).json({
        error: "الطلب ليس مرفوضاً أو ملغياً",
        message: "لا يمكن استعادة طلب غير مرفوض أو ملغي",
      });
    }

    // استخراج HomeMaidId من السجل المرتبط (rejectedOrders أو cancelledOrders)
    let homeMaidIdToRestore: number | null = null;

    if (isRejected && order.rejectedOrders?.length > 0) {
      homeMaidIdToRestore = order.rejectedOrders[0].HomeMaidId ?? null;
    } else if (isCancelled && order.cancelledOrders?.length > 0) {
      homeMaidIdToRestore = order.cancelledOrders[0].HomeMaidId ?? null;
    }

    // fallback: HomemaidIdCopy إذا لم يوجد في الجدول المرتبط
    if (homeMaidIdToRestore == null && order.HomemaidIdCopy) {
      homeMaidIdToRestore = Number(order.HomemaidIdCopy);
    }

    // التحقق من أن العاملة غير مرتبطة بطلب آخر نشط
    if (homeMaidIdToRestore != null) {
      const existingOrder = await prisma.neworder.findFirst({
        where: {
          id: { not: orderId },
          HomemaidId: homeMaidIdToRestore,
          bookingstatus: {
            notIn: ["rejected", "cancelled", "طلب مرفوض", "عقد ملغي"],
          },
        },
      });

      if (existingOrder) {
        return res.status(400).json({
          error: "غير مسموح باستعادة الطلب لأن العاملة مرتبطة بطلب آخر",
          message: "غير مسموح باستعادة الطلب لأن العاملة مرتبطة بطلب آخر",
        });
      }
    }

    // حذف السجل من rejectedOrders أو cancelledOrders
    if (isRejected && order.rejectedOrders?.length > 0) {
      await prisma.rejectedOrders.deleteMany({
        where: { order_id: orderId },
      });
    } else if (isCancelled && order.cancelledOrders?.length > 0) {
      await prisma.cancelledOrders.deleteMany({
        where: { order_id: orderId },
      });
    }

    // تحديث الطلب: new_order + إعادة ربط العاملة + مسح الأسباب
    await prisma.neworder.update({
      where: { id: orderId },
      data: {
        bookingstatus: "new_order",
        ReasonOfRejection: null,
        ReasonOfCancellation: null,
        HomemaidId: homeMaidIdToRestore,
      },
    });

    res.status(200).json({ message: "تم استعادة الطلب بنجاح" });
  } catch (error) {
    console.error("Error restoring order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
