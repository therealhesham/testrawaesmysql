// pages/api/update-booking.ts
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  try {
    // Extract values from the request body
    const { id } = req.body;
    console.log(req.body);

    // الحصول على معلومات الطلب المرفوض أولاً
    const rejectedOrder = await prisma.neworder.findUnique({
      where: { id: Number(id) },
      select: {
        HomemaidIdCopy: true,
      },
    });

    if (!rejectedOrder) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }

    // التحقق من أن العاملة غير مرتبطة بطلب آخر نشط
    if (rejectedOrder.HomemaidIdCopy) {
      const existingOrder = await prisma.neworder.findFirst({
        where: {
          HomemaidId: Number(rejectedOrder.HomemaidIdCopy),
          bookingstatus: {
            notIn: ["rejected", "cancelled"],
          },
        },
      });

      if (existingOrder) {
        return res.status(400).json({ 
          error: "غير مسموح باستعادة الطلب لأن العاملة مرتبطة بطلب آخر",
          message: "غير مسموح باستعادة الطلب لأن العاملة مرتبطة بطلب آخر"
        });
      }
    }

    // Update the `NewOrder` and connect to `HomeMaid`, and also update `HomeMaid`
    const updatedOrder = await prisma.neworder.update({
      where: { id: Number(id) },
      data: {
        bookingstatus: "new_order", // Update the booking status for the order
        ReasonOfRejection: "", // Update the reason of rejection
        HomemaidId: rejectedOrder.HomemaidIdCopy ? Number(rejectedOrder.HomemaidIdCopy) : null,
      },
    });

    // Respond with the updated records
    res.status(200).json({ updatedOrder, message: "تم استعادة الطلب بنجاح" });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
