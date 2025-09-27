import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { SponsorName, PassportNumber, OrderId, age, page, perPage, contractType, nationality } = req.query;

  // Set the page size for pagination
  const pageSize = parseInt(perPage as string, 10) || 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  if (OrderId) {
    filters.id = {
      equals: Number(OrderId),
    };
  }
  if (SponsorName) {
    filters.Name = {
      contains: (SponsorName as string).toLowerCase(),
      // mode: "insensitive",
    };
  }
  if (PassportNumber) {
    filters.Passportnumber = {
      contains: PassportNumber as string,
    };
  }
  if (age) {
    const ageNum = parseInt(age as string, 10);
    if (!isNaN(ageNum)) {
      const today = new Date();

      // أقصى تاريخ ميلاد (الأكبر سنًا)
      const maxBirthDate = new Date(
        today.getFullYear() - ageNum,
        today.getMonth(),
        today.getDate()
      );

      // أقل تاريخ ميلاد (الأصغر سنًا)
      const minBirthDate = new Date(
        today.getFullYear() - ageNum - 1,
        today.getMonth(),
        today.getDate() + 1
      );

      filters.dateofbirth = {
        gte: minBirthDate.toISOString(),
        lte: maxBirthDate.toISOString(),
      };
    }
  }
  if (nationality) {
    filters.office = {
      Country: {
        contains: nationality as string,
        // mode: "insensitive",
      },
    };
  }

  try {
    // Add contract type filtering if specified
    let contractTypeFilter = {};
    if (contractType) {
      // Join with neworder table to filter by contract type
      contractTypeFilter = {
        NewOrder: {
          some: {
            typeOfContract: contractType as string,
          },
        },
      };
    }

    // Combine all filters
    const combinedFilters = {
      ...filters,
      ...contractTypeFilter,
    };

    // Count total records for pagination
    const totalRecords = await prisma.homemaid.count({
      where: combinedFilters,
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Get counts for each contract type
    const recruitmentCount = await prisma.homemaid.count({
      where: {
        ...filters,
        NewOrder: {
          some: {
            typeOfContract: 'recruitment',
          },
        },
      },
    });

    const rentalCount = await prisma.homemaid.count({
      where: {
        ...filters,
        NewOrder: {
          some: {
            typeOfContract: 'rental',
          },
        },
      },
    });

    // Fetch data with the filters and pagination
    const homemaids = await prisma.homemaid.findMany({
      include: {
        office: {
          select: {
            office: true,
            Country: true,
          },
        },
      },
      where: combinedFilters,
      orderBy: { id: "desc" },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    // Map the data to match the frontend's expected field names
    const formattedData = homemaids.map((homemaid) => ({
      id: homemaid.id,
      Name: homemaid.Name || "",
      homemaidId: homemaid.id, // Added to match frontend navigation
      phone: homemaid.phone || "",
      maritalstatus: homemaid.maritalstatus || "",
      dateofbirth: homemaid.dateofbirth || "",
      Passportnumber: homemaid.Passportnumber || "",
      PassportStart: homemaid.PassportStart || "",
      PassportEnd: homemaid.PassportEnd || "",
      office: homemaid.office
        ? {
            office: homemaid.office.office || "",
            Country: homemaid.office.Country || "",
          }
        : { office: "", Country: "" },
    }));

    // Send the filtered, paginated, and formatted data as the response
    res.status(200).json({
      data: formattedData,
      totalPages,
      totalRecords,
      recruitmentCount,
      rentalCount,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}
