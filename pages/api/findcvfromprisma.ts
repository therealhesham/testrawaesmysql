import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { searchTerm, Passportnumber } = req.query;

  try {
    // Construct a dynamic search query based on what parameters are provided
    const query: any = {}; // Initialize query object

    // If searchTerm is provided, search by Name (case-insensitive)
    if (searchTerm) {
      query.Name = {
        contains: searchTerm as string,
      };
    }

    // If Passportnumber is provided, search by Passportnumber
    if (Passportnumber) {
      query.Passportnumber = Passportnumber as string;
    }

    // Query the Prisma database to find matching homemaid records
    const homemaids = await prisma.homemaid.findMany({
      where: query, // Apply the filters to the query
      take: 10, // Limit results to 10 for performance
    });

    // Return the found homemaids
    return res.status(200).json(homemaids);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error fetching data from the database." });
  }
}
