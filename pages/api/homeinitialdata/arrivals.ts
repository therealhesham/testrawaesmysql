import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";  


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const arrivalsCount = await prisma.arrivallist.count({
      where: {
        KingdomentryDate: { not: null },
      }
    });
    const arrivals = await prisma.arrivallist.findMany({
      where: {
        KingdomentryDate: { not: null },
      },
      take:  3,
      orderBy: { KingdomentryDate: "desc" },
    });
    res.status(200).json({ data: arrivals, arrivalsCount });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}