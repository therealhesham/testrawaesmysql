import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const {
        ClientName,
        typeOfContract,
        Passport,
        Nationality,
        Passportnumber,
        searchTerm,
        age,
        clientphonenumber,
        Nationalitycopy,
        page,
        HomemaidId,
      } = req.query;

      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      // Validate pageNumber
      if (pageNumber < 1) {
        return res.status(400).json({ error: "Page number must be positive" });
      }

      const filters: any = {};

      if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };
      if (clientphonenumber) filters.clientphonenumber = { contains: clientphonenumber };
      if (HomemaidId) filters.HomemaidId = { equals: Number(HomemaidId) };
      if (age) {
        const ageNum = parseInt(age as string, 10);
        if (!isNaN(ageNum)) {
          // Calculate birth year directly from current year minus age
          const currentYear = new Date().getFullYear();
          const targetBirthYear = currentYear - ageNum;
          
          // Search for birth year with tolerance of ±2 years
          filters.dateofbirth = {
            gte: `${targetBirthYear - 2}-01-01`,
            lte: `${targetBirthYear + 2}-12-31`,
          };
        }
      }
      if (Nationalitycopy) {
        filters.Nationalitycopy = { contains: (Nationalitycopy as string).toLowerCase() };
      }
      if (typeOfContract) {
        filters.typeOfContract = { equals: typeOfContract };
      }

      // Fetch paginated data
      const homemaids = await prisma.neworder.findMany({
        orderBy: { id: "desc" },
        where: {
          ...filters,
          bookingstatus: { in: ["received"] },
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      // Fetch total count
      const totalCount = await prisma.neworder.count({
        where: {
          ...filters,
          bookingstatus: { in: ["received"] },
        },
      });

      // Send paginated data and total count
      return res.status(200).json({
        homemaids,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: { bookingstatus: "delivered" },
      });
      return res.status(200).json(updatedOrder);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}