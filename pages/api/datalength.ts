// pages/api/update-booking.ts
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  try {
    const neworderCount = await prisma.neworder.count({
      where: { bookingstatus: "حجز جديد" },
    });
    const arrivalsCount = await prisma.arrivallist.count();

    // const neworder = await prisma.neworder.count({
    //   where: { HomemaidId: null },
    // });

    const currentorders = await prisma.neworder.count({
      where: {
        NOT: { bookingstatus: "حجز جديد" },
        AND: { bookingstatus: { not: { equals: "طلب مرفوض" } } },
        // and:{}
      },
    });

    const rejectedOrders = await prisma.neworder.count({
      where: {
        bookingstatus: "طلب مرفوض",
      },
    });

    const transferSponsorships = await prisma.transfer.count();

    res.status(200).json({
      rejectedOrders,
      currentorders,
      transferSponsorships,
      arrivalsCount,
      neworderCount,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Disconnect the Prisma client to release database connections
    await prisma.$disconnect();
  }
}
