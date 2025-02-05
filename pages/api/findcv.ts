import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    searchTerm, // This will be the single input from the frontend
    age,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
  } = req.query;
  console.log(req.query);

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  // Apply a filter for `clientphonenumber` if present
  if (clientphonenumber)
    filters.clientphonenumber = { contains: clientphonenumber };

  // Apply a filter for `HomemaidId` if present
  if (HomemaidId) filters.HomemaidId = { equals: Number(HomemaidId) };

  // Apply a filter for `age` if present
  if (age) filters.age = { equals: parseInt(age as string, 10) };

  // Apply a filter for `Nationalitycopy` if present
  if (Nationalitycopy) {
    filters.Nationalitycopy = {
      contains: (Nationalitycopy as string).toLowerCase(),
    };
  }

  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.homemaid.findUnique({
      // orderBy: { id: "desc" },
      where: {
        ...filters,
        // Apply the searchTerm to multiple fields (e.g., ClientName, Passportnumber)
        AND: [
          {
            OR: [
              {
                ClientName: {
                  contains: searchTerm
                    ? (searchTerm as string).toLowerCase()
                    : "",
                },
              },
              {
                Name: {
                  contains: searchTerm
                    ? (searchTerm as string).toLowerCase()
                    : "",
                },
              },
            ],
          },
        ],
      },
    });

    // Send the filtered and paginated data as the response
    res.status(200).json(homemaids);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
