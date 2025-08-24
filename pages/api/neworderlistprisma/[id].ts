//@ts-nocheck
//@ts-ignore

import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();
  const page = parseInt(req.query.id as string) || 1; 
  const pageSize = 10; // Number of items per page

  try {
    // Count total records that match the criteria
    const totalItems = await prisma.neworder.count({
      where: {
        // isHidden: false,
        bookingstatus: "حجز جديد",
      },
    });
    const totalPages = Math.ceil(totalItems / pageSize);

    const find = await prisma.neworder.findMany({
      where: {
        // isHidden: false,
        bookingstatus: "حجز جديد",
      },
      select: {
        HomeMaid: {
          select: {
            Name: true,
            Nationality: true, // Added to match table display
            Passportnumber: true, // Added to match table display
          },
        },
        age: true,
        ages: true,
        id: true,
        Name: true,
        ClientName: true,
        clientphonenumber: true,
        Passportnumber: true,
        Religion: true,
        HomemaidIdCopy: true,
        createdAt: true,
        Experience: true,
        HomemaidId: true,
        ExperienceYears: true,
        nationalId: true, // Added to match table display
        bookingstatus: true, // Added to ensure bookingstatus is included
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize, // Adjusted to use page - 1
      take: pageSize,
    });

    res.status(200).json({ data: find, totalPages });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  } finally {
    await prisma.$disconnect();
  }
}