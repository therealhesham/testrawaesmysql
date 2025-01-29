import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method == "get") {
      const { ClientName, age, Passport, Nationality, page } = req.query;
      console.log(req.query);
      // Set the page size for pagination
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

      // Build the filter object dynamically based on query parameters
      const filters: any = {};

      if (ClientName)
        filters.ClientName = { contains: (ClientName as string).toLowerCase() };

      const homemaids = await prisma.neworder.findMany({
        where: {
          ...filters,
          bookingstatus: "عقد ملغي",
        },
        skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
        take: pageSize, // Limit the results to the page size
      });

      // Send the filtered and paginated data as the response
      res.status(200).json(homemaids);
    } else if (req.method == "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: {
          bookingstatus: "عقد ملغي", // Update the booking status for the order
        },
      });
      res.status(200).json(updatedOrder);
    }

    // Fetch data with the filters and pagination
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
