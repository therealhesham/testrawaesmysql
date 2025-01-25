import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

// Create a singleton PrismaClient instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Ensure the PrismaClient instance is reused in development for hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const offices = await prisma.arrivallist.findMany();
    console.log(offices); // If needed for debugging
    res.status(200).json(offices);
  } catch (error) {
    console.error(error); // Improved error logging
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}
