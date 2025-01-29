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
    const { id, ReasonOfRejection, homeMaidId, homeMaidBookingStatus } =
      req.body;

    // Update the `NewOrder` and connect to `HomeMaid`, and also update `HomeMaid`
    const updatedOrder = await prisma.neworder.update({
      where: { id: Number(id) },
      data: {
        bookingstatus: "حجز جديد", // Update the booking status for the order
        ReasonOfRejection: "", // Update the reason of rejection
        HomeMaid: {
          connect: { id: Number(homeMaidId) }, // Connect the HomeMaid by its id
        },
      },
    });

    // Respond with the updated records
    res.status(200).json({ updatedOrder });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
