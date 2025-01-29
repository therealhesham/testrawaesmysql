import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Clientname, age, Passport, Nationality, page } = req.query;
  console.log(req.query);
  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  if (Clientname)
    filters.ClientName = { contains: (Clientname as string).toLowerCase() };
  // if (age) filters.age = { equals: parseInt(age as string, 10) };
  // if (Passport)
  //   filters.Passportnumber = { contains: (Passport as string).toLowerCase() };
  // if (Nationality)
  //   filters.Nationalitycopy = {
  //     contains: (Nationality as string).toLowerCase(),
  //   };
  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.neworder.findMany({
      where: {
        ...filters,
        bookingstatus: "طلب مرفوض",
      },
      skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
      take: pageSize, // Limit the results to the page size
    });
    console.log(homemaids);
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
