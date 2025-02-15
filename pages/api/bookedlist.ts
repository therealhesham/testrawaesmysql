import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Name, age, Passportnumber, id, Nationality, page } = req.query;
  console.log(req.query);

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  if (id) filters.id = { equals: Number(id) };
  if (Name) filters.Name = { contains: (Name as string).toLowerCase() };
  if (age) filters.age = { equals: parseInt(age as string, 10) };
  if (Passportnumber)
    filters.Passportnumber = {
      contains: (Passportnumber as string).toLowerCase(),
    };
  if (Nationality)
    filters.Nationalitycopy = {
      contains: (Nationality as string).toLowerCase(),
    };

  try {
    // Fetch data from homemaid where there is no associated neworder
    const homemaids = await prisma.homemaid.findMany({
      where: {
        ...filters,
        NewOrder: {
          some: {}, // Filters where no related neworder exists for this homemaid
        },
      },
      // ordersBy: "desc",
      include: {
        NewOrder: { select: { id: true, ClientName: true } },
        Housed: { select: { isHoused: true } },
      },
      skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
      take: pageSize, // Limit the results to the page size
      orderBy: { id: "desc" },
    });
    // console.log();
    // console.log(homemaids[0].NewOrder[0].ClientName);
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
