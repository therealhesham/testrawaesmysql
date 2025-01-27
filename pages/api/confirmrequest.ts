import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check for the correct HTTP method
    // Apply `excludeNullFields` if you want to ensure null or undefined fields are excluded from the update
    // Prisma update query
    const createarrivallist = await prisma.neworder.update({
      where: { id: req.body.id },
      data: {
        bookingstatus: "التواصل مع العميل",
        ArrivalList: {
          connect: {
            OrderId: req.body.id,
            BookinDate: new Date(req.body.createdAt).toISOString(),
          },
        },
      },
    });

    res.status(200).json(createarrivallist);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
}
