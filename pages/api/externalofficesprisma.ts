import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();
  try {
    // Fetch offices with the count of related people
    const offices = await prisma.offices.findMany({include:{_count:true}});
    const countries = await prisma.offices.findMany({
distinct: ['Country'],
select:{Country:true,id:true,phoneNumber:true}
    });
    res.status(200).json({ offices, countries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
