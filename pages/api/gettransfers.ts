import { NextApiRequest, NextApiResponse } from "next";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Fetch all transfers from the Transfer table
      const transfers = await prisma.transfer.findMany();

      // Return the fetched transfers as the response
      return res.status(200).json(transfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      return res.status(500).json({ error: "Failed to fetch transfers" });
    } finally {
      // Disconnect Prisma client after the request
      await prisma.$disconnect();
    }
  } else {
    // Handle unsupported HTTP methods
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
