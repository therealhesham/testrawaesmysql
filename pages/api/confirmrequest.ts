import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

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

    try {
      const token = req.cookies?.authToken;
      let userId: string | null = null;

      if (token) {
        const decoded: any = jwt.verify(token, "rawaesecret");
        userId = decoded?.username;
      }

      await prisma.logs.create({
        data: {
          Status: `  تم تأكيد الطلب رقم ${waiter?.id}   للعميل  ${waiter?.ClientName}  `,
          homemaidId: waiter?.HomemaidId,
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Error updatin logs:", error);
    }

    // Return the updated order with the newly created arrival
    res.status(200).json(waiter);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}
