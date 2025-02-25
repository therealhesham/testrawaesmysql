import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log(req.query);
    // Get page and limit from query parameters
    const page = Number(req.query.page) || 1; // Default to page 1
    const limit = 10; // Default to 10 results per page
    console.log((page - 1) * limit);

    const skip = (page - 1) * limit;

    // Query transactions with pagination
    const transactions = await prisma.transactions.findMany({
      where: { order_id: { not: { lt: 1 } } },
      skip: skip,
      take: limit,
    });

    // Optionally, you can also count the total number of transactions

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
