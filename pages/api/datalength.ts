// pages/api/update-booking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const neworderCount = await prisma.neworder.count({
      where: { bookingstatus: "new_order" },
    });

    const arrivalsCount = await prisma.arrivallist.count();

    const lastSeven = await prisma.neworder.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    // Group new orders by office location
    const ordersWithHomemaid = await prisma.neworder.findMany({
      include: {
        HomeMaid: {
          include: {
            office: true, // Include the office relation
          },
        },
      },
    });

    // Manually group by office Location in TypeScript
    const newOrderByLocation = ordersWithHomemaid.reduce((acc, order) => {
      // Safely access the Location field, default to "Unknown" if not available
      const location = order.HomeMaid?.office?.Country ?? "Unknown";
      
      // console.log("Location:", location);
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);


    const currentorders = await prisma.neworder.count({
      where: {
        NOT: {
          bookingstatus: {
            in: ["new_order", "delivered", "cancelled", "rejected"],
          },
        },
      },
    });

    const deparatures = await prisma.arrivallist.count({
      where: {
        internaldeparatureDate: { not: null },
      },
    });

    const rejectedOrders = await prisma.neworder.count({
      where: {
        bookingstatus: "rejected",
      },
    });

    const cancelledorders = await prisma.neworder.count({
      where: {
        bookingstatus: "cancelled",
      },
    });

    const finished = await prisma.neworder.count({
      where: {
        bookingstatus: "delivered",
      },
    });

    const transferSponsorShipsSponsorships = await prisma.transferSponsorShips.count();
    const offices = await prisma.offices.count();

    const arrivals = await prisma.arrivallist.count({
      where: { KingdomentryDate: { not: null } },
    });
console.log(arrivals)
    res.status(200).json({
      cancelledorders,
      finished,
      rejectedOrders,
      arrivals,
      deparatures,
      currentorders,
      lastSeven,
      transferSponsorShipsSponsorships,
      offices,
      arrivalsCount,
      neworderCount,
      newOrderByLocation, 
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}