// Next.js API route for fetching homemaid data with pagination
//@ts-nocheck
//@ts-ignore
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

// Initialize Prisma client
const prisma = new PrismaClient();

// Handler function for the API route
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log(req.query);
    // Parse pagination parameters from the query
    const page = parseInt(req.query.id); // Default to page 1 if not provided
    const pageSize = 10; // Number of records per page
    const skip = (page - 1) * pageSize; // Calculate the number of records to skip

    // Fetch data from the Prisma database
    const homemaids = await prisma.homemaid.findMany({
      skip: skip, // Skip records based on the page
      take: pageSize, // Limit the number of records per page
    });
    console.log(homemaids.length);

    // Return the fetched data as JSON
    res.status(200).json(homemaids);
  } catch (error) {
    // Handle any errors that occur during the fetch
    console.error("Error fetching homemaid data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}
