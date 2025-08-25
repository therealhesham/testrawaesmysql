import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    searchTerm,
    age,
    externalOfficeStatus,
    InternalmusanedContract,
    Passportnumber,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
    Country,
  } = req.query;


  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  try {
    // Fetch data with the filters and pagination
    const clients = await prisma.neworder.findMany({
      
      });

    res.status(200).json({ clients });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}