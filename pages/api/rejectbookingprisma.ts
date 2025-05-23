// pages/api/update-booking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const updated = await prisma.neworder.update({
      where: { id: Number(req.body.id) },
      data: {
        bookingstatus: "طلب مرفوض",
        ReasonOfRejection: req.body.ReasonOfRejection,
        HomeMaid: { disconnect: true },
      },
    });

    // Respond with the updated booking status
    res.status(200).json(updated.bookingstatus);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Disconnect the Prisma client to release database connections
    await prisma.$disconnect();
  }
}
