import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { tr } from "date-fns/locale";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { SponsorName, age, PassportNumber, page, OrderId, perPage } = req.query;

  // Set the page size for pagination
  const pageSize = parseInt(perPage as string, 10) || 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  if (OrderId) filters.OrderId = { equals: Number(OrderId) };
  if (SponsorName)
    filters.SponsorName = { contains: (SponsorName as string).toLowerCase(), mode: "insensitive" };
  if (PassportNumber)
    filters.PassportNumber = {
      contains: (PassportNumber as string).toLowerCase(),
    };
  if (age) filters.age = { equals: parseInt(age as string, 10) };

  try {
    // Count total records for pagination
    const totalRecords = await prisma.arrivallist.count({
      where: {
        ...filters,
        deparatureDate: { not: null },
      },
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Fetch data with the filters and pagination
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        ...filters,
        deparatureDate: { not: null },
      },
      select: {
        Order: { select: { Name: true ,HomemaidId: true,HomeMaid:true} },
        OrderId: true,
        
        SponsorName: true,
        PassportNumber: true,
        deparatureDate: true,
        deparatureTime: true,
        SponsorPhoneNumber: true,
        HomemaidName: true,
        id: true,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });

    // Send the filtered and paginated data with totalPages
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