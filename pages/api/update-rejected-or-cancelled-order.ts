import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

function isRejectedStatus(bookingstatus: string | null | undefined) {
  const s = (bookingstatus || "").toLowerCase();
  return s === "rejected" || s === "طلب مرفوض";
}

function isCancelledStatus(bookingstatus: string | null | undefined) {
  const s = (bookingstatus || "").toLowerCase();
  return s === "cancelled" || s === "عقد ملغي";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const orderId = Number(req.body.orderId);
    const reason = String(req.body.reason ?? "").trim();

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ error: "معرف الطلب مطلوب" });
    }
    if (!reason) {
      return res.status(400).json({ error: "السبب مطلوب" });
    }

    const order = await prisma.neworder.findUnique({
      where: { id: orderId },
      select: { bookingstatus: true },
    });

    if (!order) {
      return res.status(404).json({ error: "الطلب غير موجود" });
    }

    let eventDate: Date | undefined;
    if (req.body.eventDate != null && req.body.eventDate !== "") {
      const parsed = new Date(
        typeof req.body.eventDate === "string"
          ? req.body.eventDate
          : String(req.body.eventDate)
      );
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "تاريخ غير صالح" });
      }
      eventDate = parsed;
    }

    if (isRejectedStatus(order.bookingstatus)) {
      await prisma.$transaction([
        prisma.neworder.update({
          where: { id: orderId },
          data: { ReasonOfRejection: reason },
        }),
        prisma.rejectedOrders.updateMany({
          where: { order_id: orderId },
          data: {
            ReasonOfRejection: reason,
            ...(eventDate != null && { RejectionDate: eventDate }),
          },
        }),
      ]);
      return res.status(200).json({ ok: true });
    }

    if (isCancelledStatus(order.bookingstatus)) {
      await prisma.$transaction([
        prisma.neworder.update({
          where: { id: orderId },
          data: { ReasonOfCancellation: reason },
        }),
        prisma.cancelledOrders.updateMany({
          where: { order_id: orderId },
          data: {
            ReasonOfCancellation: reason,
            ...(eventDate != null && { CancellationDate: eventDate }),
          },
        }),
      ]);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({
      error: "الطلب ليس في حالة مرفوض أو ملغي",
    });
  } catch (error) {
    console.error("update-rejected-or-cancelled-order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
