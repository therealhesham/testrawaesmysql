import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {



//   externaldeparatureCity  String? @db.VarChar(191) 
//   externaldeparatureDate DateTime?
//   externaldeparatureTime   String?
//       externalArrivalCity String?
// externalArrivalCityDate          DateTime?
//  externalArrivalCityTime           String?  @db.VarChar(30)

// externalTicketFile              String?   @db.VarChar(255)

  try {
      const deparaturesCount = await prisma.arrivallist.count({
      where: {
        externaldeparatureDate: { not: null },
      }});
    const deparatures = await prisma.arrivallist.findMany({
      where: {
        externaldeparatureDate: { not: null },
      },
           select: {
        Order: { select: { Name: true ,HomemaidId: true,HomeMaid:true} },
        OrderId: true,
externalArrivalCity:true,        
        SponsorName: true,
        // createdAt:true,
        externaldeparatureDate:true,
        PassportNumber: true,
        // deparatureDate: true,
        externaldeparatureTime: true,
        SponsorPhoneNumber: true,
        HomemaidName: true,
        id: true,
      },
      take: 3, 
      orderBy: { externaldeparatureDate: "desc" },
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
