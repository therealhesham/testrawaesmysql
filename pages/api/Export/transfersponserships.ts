import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {



  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.transferSponsorShips.findMany({
        include: {
          OldClient: true,
          NewClient:true,
          HomeMaid:true
        },
     
      });

    res.status(200).json({ homemaids });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}