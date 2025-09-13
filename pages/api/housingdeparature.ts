import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.body)
  try {
    // Fetch data 
      await prisma.housedworker.update({
        where: {id: Number(req.body.homeMaid) },
        data: {
          isActive: false,
          deparatureReason:req.body.deparatureReason ,
          deparatureHousingDate: req.body.deparatureHousingDate?new Date(req.body.deparatureHousingDate).toISOString():"",
          checkIns: {
            updateMany: {
              where: { isActive: true }, // Add appropriate conditions here
              data: { isActive: false },
            },
          },
        },
      });

      res.status(201).json("sss");
    
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
