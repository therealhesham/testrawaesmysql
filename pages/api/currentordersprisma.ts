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
    externalOfficeStatus,
    InternalmusanedContract,
    Passportnumber,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,

    office,
  } = req.query;
  console.log(req.query);

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  // ;
  if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };
  if (office) filters.HomeMaid = { officeName: office };
  // Apply a filter for `clientphonenumber` if present
  if (clientphonenumber)
    filters.clientphonenumber = { contains: clientphonenumber };
  // externalOfficeStatus;

  if (InternalmusanedContract) {
    filters.arrivals = {
      some: {
        InternalmusanedContract: {
          contains: InternalmusanedContract,
        },
      },
    };
  }

  if (externalOfficeStatus) {
    filters.arrivals = {
      some: {
        externalOfficeStatus: {
          contains: externalOfficeStatus,
        },
      },
    };
  }

  // Apply a filter for `age` if present

  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.neworder.findMany({
      orderBy: { id: "desc" },
      include: {
        HomeMaid: { select: { officeName: true } },
        arrivals: {
          select: { InternalmusanedContract: true, externalOfficeStatus: true }, // Specify the fields you want
        },
      },
      where: {
        ...filters,
        NOT: {
          bookingstatus: {
            in: ["حجز جديد", "الاستلام", "عقد ملغي", "اكمال الطلب"], // Exclude these statuses
          },
        },
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
      skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
      take: pageSize, // Limit the results to the page size
    });
    // console.log(homemaids[0].HomeMaid?.officeName)
    // console.log(homemaids[0].arrivals[0].InternalmusanedContract);
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
