import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { SponsorName, age, PassportNumber, page, OrderId } = req.query;
  console.log(req.query);
  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1; // Handle the page query as a number

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  if (OrderId) filters.HomemaidId = { equals: Number(OrderId) };
  if (SponsorName)
    filters.SponsorName = { contains: (SponsorName as string).toLowerCase() };
  // if (age) filters.age = { equals: parseInt(age as string, 10) };
  if (PassportNumber)
    filters.PassportNumber = {
      contains: (PassportNumber as string).toLowerCase(),
    };
  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        ...filters,
        DeparatureFromSaudiDate: { not: null },
      },
      select: {
        Order: { select: { Name: true } },
        OrderId: true,
        SponsorName: true,
        PassportNumber: true,
        KingdomentryDate: true,
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
        DeparatureFromSaudiDate: true,
        DeparatureFromSaudiCity: true,
        DeparatureFromSaudiTime: true,
      },
      skip: (pageNumber - 1) * pageSize, // Pagination logic (skip previous pages)
      take: pageSize, // Limit the results to the page size,
      orderBy: { id: "desc" },
    });
    // console.log("homemiad", );
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
