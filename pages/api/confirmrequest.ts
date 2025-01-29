import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id, SponsorName, PassportNumber, HomemaidName, KingdomentryDate } =
      req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required." });
    }
    const waiter = await prisma.neworder.update({
      where: { id },
      data: { bookingstatus: "اكمال الطلب" },
    });
    await prisma.arrivallist.create({
      data: {
        // OrderId:id,
        SponsorName,
        HomemaidName,
        PassportNumber,
        Order: { connect: { id } },
      },
    });

    // Return the updated order with the newly created arrival
    res.status(200).json(waiter);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}
