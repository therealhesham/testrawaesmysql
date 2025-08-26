import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    searchTerm,
    age,
    externalOfficeStatus,
    InternalmusanedContract,
    Passportnumber,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
    Country,
  } = req.query;

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };

  if (InternalmusanedContract) {
    filters.arrivals = {
      some: {
        InternalmusanedContract: { contains: InternalmusanedContract },
      },
    };
  }
  if (externalOfficeStatus) {
    filters.arrivals = {
      some: {
        externalOfficeStatus: { contains: externalOfficeStatus },
      },
    };
  }

  // Age filter: Calculate age from dateofbirth
  if (age) {
    const [minAge, maxAge] = (age as string).split("-").map(Number);
    const currentYear = new Date().getFullYear();
    const minBirthYear = currentYear - maxAge;
    const maxBirthYear = currentYear - minAge;

    filters.HomeMaid = {
      ...filters.HomeMaid,
      dateofbirth: {
        gte: `${maxBirthYear}-01-01`, // Greater than or equal to max birth year
        lte: `${minBirthYear}-12-31`, // Less than or equal to min birth year
      },
    };
  }

  // Nationality filter: Search in neworder.Nationalitycopy, homemaid.Nationalitycopy, and offices.Country
  if (Country) {
    filters.AND = [
      ...(filters.AND || []),
      {
        OR: [
          {
            HomeMaid: {
              office: {
                Country: { contains: Country as string },
              },
            },
          },
        ],
      },
    ];
  }

  try {
    // Fetch data with the filters and pagination
    const [homemaids, totalCount] = await Promise.all([
      prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          client: true,
          HomeMaid: {
            select: {
              dateofbirth: true,
              Name: true,
              Passportnumber: true,
              id: true,
              officeName: true,
              Nationalitycopy: true,
              office: {
                select: {
                  Country: true,
                },
              },
              logs: { include: { user: true } },
            },
          },
        },
        where: {
          bookingstatus: "new_order",
          ...filters,
          AND: [
            ...(filters.AND || []),
            {
              OR: [
                {
                  ClientName: {
                    contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                  },
                },
                {
                  Name: {
                    contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                  },
                },
                {
                  HomeMaid: {
                    Name: {
                      contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                    },
                  },
                },
              ],
            },
          ],
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.neworder.count({
        where: {
          bookingstatus: "new_order",
          ...filters,
          AND: [
            ...(filters.AND || []),
            {
              OR: [
                {
                  ClientName: {
                    contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                  },
                },
                {
                  Name: {
                    contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                  },
                },
                {
                  HomeMaid: {
                    Name: {
                      contains: searchTerm ? (searchTerm as string).toLowerCase() : "",
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
    ]);

    res.status(200).json({ homemaids, totalCount, page: pageNumber, pageSize });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}