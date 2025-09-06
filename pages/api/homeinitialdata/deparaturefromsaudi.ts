import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
      const deparaturesCount = await prisma.arrivallist.count({
      where: {
        DeparatureFromSaudiDate: { not: null },
      }});
    const deparatures = await prisma.arrivallist.findMany({
      where: {
        DeparatureFromSaudiDate: { not: null },
      },
           select: {
        Order: { select: { Name: true ,HomemaidId: true,HomeMaid:true} },
        OrderId: true,
ArrivalOutSaudiCity:true,        
        SponsorName: true,
        // createdAt:true,
        DeparatureFromSaudiDate:true,
        PassportNumber: true,
        deparatureDate: true,
        deparatureTime: true,
        SponsorPhoneNumber: true,
        HomemaidName: true,
        id: true,
      },
      take: 3, 
      orderBy: { id: "desc" },
    });
    res.status(200).json({data:deparatures,deparaturesCount});
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
