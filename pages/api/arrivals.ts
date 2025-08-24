import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { search, age, ArrivalCity, KingdomentryDate, page } = req.query;

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filters.OR = [
      { SponsorName: { contains: searchTerm } },
      { PassportNumber: { contains: searchTerm } },
      { OrderId: { equals: parseInt(searchTerm, 10) || undefined } },
    ];
  }
  if (age)
    filters.Order = { HomeMaid: { age: { equals: parseInt(age as string, 10) } } };
  if (ArrivalCity)
    filters.ArrivalCity = { contains: (ArrivalCity as string).toLowerCase() };
  if (KingdomentryDate)
    filters.KingdomentryDate = {
      gte: new Date(KingdomentryDate as string),
      lte: new Date(new Date(KingdomentryDate as string).setHours(23, 59, 59, 999)),
    };

  try {
    // Get total count of records matching the filters
    const totalRecords = await prisma.arrivallist.count({
      where: {
        ...filters,
        KingdomentryDate: { not: null },
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Fetch data with the filters and pagination
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        ...filters,
        KingdomentryDate: { not: null },
      },
      select: {
        Order: {
          select: {
            Name: true,
            ClientName: true,
            HomeMaid: {
              select: { Name: true, Passportnumber: true, id: true, office: true, age: true },
            },
            clientphonenumber: true,
            id: true,
          },
        },
        OrderId: true,
        SponsorName: true,
        PassportNumber: true,
        KingdomentryDate: true,
        KingdomentryTime: true,
        deparatureDate: true,
        deparatureTime: true,
        ArrivalCity: true,
        medicalCheckFile: true,
        ticketFile: true,
        SponsorPhoneNumber: true,
        SponsorIdnumber: true,
        InternalmusanedContract: true,
        finaldestination: true,
        finalDestinationDate: true,
        HomemaIdnumber: true,
        HomemaidName: true,
        Notes: true,
        id: true,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });

    // Send the filtered and paginated data along with totalPages
    res.status(200).json({
      data: homemaids,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}