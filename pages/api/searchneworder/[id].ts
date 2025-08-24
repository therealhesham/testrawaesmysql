//@ts-nocheck
//@ts-ignore
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();
  const query = req.query.id ? req.query.id.toString() : "";
  const page = parseInt(req.query.page as string) || 1; // Default to page 1
  const pageSize = 10; // Number of items per page

  try {
    // Count total records that match the search criteria
    const totalItems = await prisma.neworder.count({
      where: {
        bookingstatus: {
          in: ["حجز جديد"],
        },
        OR: [
          { ClientName: { contains: query, mode: "insensitive" } },
          { clientphonenumber: { contains: query, mode: "insensitive" } },
          { Passportnumber: { contains: query, mode: "insensitive" } },
          { Religion: { contains: query, mode: "insensitive" } },
        ],
      },
    });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Fetch data for the current page
    const users = await prisma.neworder.findMany({
      where: {
        bookingstatus: {
          in: ["حجز جديد"],
        },
        OR: [
          { ClientName: { contains: query, mode: "insensitive" } },
          { clientphonenumber: { contains: query, mode: "insensitive" } },
          { Passportnumber: { contains: query, mode: "insensitive" } },
          { Religion: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        age: true,
        ages: true,
        id: true,
        HomemaidId: true,
        phone: true,
        ClientName: true,
        clientphonenumber: true,
        Passportnumber: true,
        Religion: true,
        Experience: true,
        ExperienceYears: true,
        nationalId: true, // Added to match table display
        HomeMaid: {
          select: {
            Name: true,
            Nationality: true, // Added to match table display
            Passportnumber: true, // Added to match table display
          },
        },
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.status(200).json({ data: users, totalPages });
  } catch (error) {
    console.error("Error searching data:", error);
    res.status(500).json({ error: "Failed to search data" });
  } finally {
    await prisma.$disconnect();
  }
}