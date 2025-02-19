import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  try {
    // Fetch the arrival list entry based on OrderId
    const find = await prisma.arrivallist.findFirst({
      where: { OrderId: Number(req.body.id) },
    });

    if (!find?.KingdomentryDate) {
      throw new Error("Kingdom entry date not found");
    }

    // Get the current date
    const currentDate = new Date();

    // Compare current date with the Kingdom entry date
    if (currentDate < new Date(find.KingdomentryDate)) {
      throw new Error("Current date is after the Kingdom entry date");
    }
    if (req.body.profileStatus == "مغادرة") {
      if (!find?.deparatureDate) {
        throw new Error("Current date is after the deparature entry date");
      }
      if (currentDate < new Date(find.deparatureDate)) {
        throw new Error("Current date is after the deparature entry date");
      }
    }
    // req.body.profileStatus;
    // Proceed with updating the booking status
    const updated = await prisma.neworder.update({
      where: { id: Number(req.body.id) },
      data: { profileStatus: req.body.profileStatus },
    });

    // Respond with the updated booking status
    res.status(200).json(updated.bookingstatus);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  } finally {
    // Disconnect the Prisma client to release database connections
    await prisma.$disconnect();
  }
}
