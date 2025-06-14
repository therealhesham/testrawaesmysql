import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    Passportnumber,
    searchTerm,
    age,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
  } = req.query;

  console.log(req.query);

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };
  if (clientphonenumber) filters.clientphonenumber = { contains: clientphonenumber };
  if (HomemaidId) filters.HomemaidId = { equals: Number(HomemaidId) };
  if (age) filters.age = { equals: parseInt(age as string, 10) };
  if (Nationalitycopy) {
    filters.Nationalitycopy = { contains: (Nationalitycopy as string).toLowerCase() };
  }

  // Initialize the where clause with bookingstatus
  const whereClause: any = {
    bookingstatus: {
      in: ["طلب مرفوض"],
    },
  };

  // Add searchTerm condition only if it exists and is not empty
  if (searchTerm && (searchTerm as string).trim() !== "") {
    whereClause.AND = [
      {
        OR: [
          { ClientName: { contains: (searchTerm as string).toLowerCase() } },
          { Name: { contains: (searchTerm as string).toLowerCase() } },
        ],
      },
    ];
  }

  // Merge filters into whereClause
  Object.assign(whereClause, filters);

  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.neworder.findMany({
      orderBy: { id: "desc" },
      where: whereClause,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    // Send the filtered and paginated data as the response
    res.status(200).json(homemaids);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}