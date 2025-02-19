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
    // Build the filter object dynamically based on query parameters

    const {
      Passportnumber,
      searchTerm, // This will be the single input from the frontend
      fullname,
      email,
      phonenumber,
    } = req.query;

    const filters: any = {};
    // Apply a filter for `clientphonenumber` if present
    if (fullname) filters.fullname = { contains: fullname };

    // Apply a filter for `HomemaidId` if present
    if (email) filters.email = { contains: email };

    // Apply a filter for `age` if present
    if (phonenumber) filters.phonenumber = { contains: phonenumber };

    console.log(req.query);
    // Parse pagination parameters from the query
    const page = parseInt(req.query.page as string) || 1; // Default to page 1 if not provided
    const pageSize = 10; // Number of records per page
    const skip = (page - 1) * pageSize; // Calculate the number of records to skip

    // Fetch clients with the count of their orders
    const clients = await prisma.client.findMany({
      orderBy: { id: "desc" },
      where: { ...filters },
      select: {
        id: true, // Select the client id or any other necessary client data
        fullname: true,
        email: true,

        createdat: true,
        phonenumber: true,
        // name: true, // Select the client name
        _count: {
          select: {
            orders: true, // Count the number of orders for each client
          },
        },
      },
      skip: skip, // Skip records based on the page
      take: pageSize, // Limit the number of records per page
    });

    console.log(clients);
    // Return the fetched data with order counts as JSON
    res.status(200).json(clients);
  } catch (error) {
    // Handle any errors that occur during the fetch
    console.error("Error fetching clients data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    // Disconnect Prisma client
    await prisma.$disconnect();
  }
}
