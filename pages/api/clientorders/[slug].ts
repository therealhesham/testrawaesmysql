import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";


const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    const { slug } = req.query;
// console.log("slug", slug);
    if (!slug) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: pid" })    }
   const orders = await prisma.client.findUnique({where:{id:Number(slug)},include:{orders:{include:{arrivals:{select:{visaNumber:true}}}},reports:true}});
    console.log("orders", orders);
    res.status(201).json(orders);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  } finally {
    await prisma.$disconnect();
  }
}
