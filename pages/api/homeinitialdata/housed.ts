import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const housed = await prisma.housedworker.findMany({
      where: {
        
        deparatureHousingDate: null,
      },
      take: 3,
      include: {
        Order: {
          select: {
            Name: true,
            phone: true,
          },
        },
      },


      orderBy: { deparatureHousingDate: "desc" },
    });
    res.status(200).json({ housed });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}