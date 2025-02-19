// pages/api/update-booking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        NOT: {
          bookingstatus: {
            in: ["حجز جديد", "الاستلام", "عقد ملغي", "طلب مرفوض"], // Exclude these statuses
          },
        },
        // and:{}
      },
    });

    const deparatures = await prisma.arrivallist.count({
      where: {
        deparatureDate: { not: null },
      },
    });

    const rejectedOrders = await prisma.neworder.count({
      where: {
        bookingstatus: "طلب مرفوض",
      },
    });

    const cancelledorders = await prisma.neworder.count({
      where: {
        bookingstatus: "عقد ملغي",
      },
    });

    const finished = await prisma.neworder.count({
      where: {
        bookingstatus: "الاستلام",
      },
    });

    const transferSponsorships = await prisma.transfer.count();
    const offices = await prisma.offices.count();

    const arrivals = await prisma.arrivallist.count({
      where: { KingdomentryDate: { not: null } },
    });

    res.status(200).json({
      cancelledorders,
      finished,
      rejectedOrders,
      arrivals,
      deparatures,
      currentorders,
      transferSponsorships,
      offices,
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
