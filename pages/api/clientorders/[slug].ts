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

  try {
    // Optional: Validate and handle any required query parameters like pid
    const { slug } = req.query;
    console.log(req.query);

    if (!slug) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: pid" });
    }

    // Counting the number of new orders (optimized if necessary)
    const orders = await prisma.neworder.findMany({
      where: { clientID: Number(slug) },
      include: { arrivals: { select: { visaNumber: true } } },
    });
    // Respond with the found data
    res.status(201).json(orders);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  } finally {
    // Disconnect Prisma client in the finally block
    await prisma.$disconnect();
  }
}
