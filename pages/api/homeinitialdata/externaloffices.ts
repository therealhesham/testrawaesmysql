import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
const dataCount= await prisma.offices.count() 
    const data = await prisma.offices.findMany({
      
           select: {
      office:true,
      Country:true
      
          },
      take: 3, 
      orderBy: { id: "desc" },
    });
    res.status(200).json({data,dataCount});
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
