import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

// Prisma client singleton to avoid opening too many connections
// let prisma: PrismaClient;

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log query params for debugging (useful during development)
  console.log("Query Params:", req.query);

  try {
    // Optional: Validate and handle any required query parameters like pid
    const { pid } = req.query;
    if (!pid) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: pid" });
    }

    // Counting the number of new orders (optimized if necessary)
    const count = await prisma.neworder.count();
    console.log("Total Orders Count:", count);

    // Retrieve bookings with specific conditions
    const find = await prisma.neworder.findMany({
      skip: (Number(pid) - 1) * 10,
      take: 10,
      where: {
        isHidden: false,
        NOT: { bookingstatus: "حجز جديد" },
        AND: { bookingstatus: { not: { equals: "طلب مرفوض" } } },
      },
    });

    console.log("Found Orders Length:", find.length);

    // Respond with the found data
    res.status(201).json({ data: find, count });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  } finally {
    // Disconnect Prisma client in the finally block
    await prisma.$disconnect();
  }
}
