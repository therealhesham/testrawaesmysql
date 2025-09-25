import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { q } = req.query;

    if (!q || (q as string).length < 1) {
      return res.status(200).json({ suggestions: [] });
    }

    try {
      const query = (q as string).toLowerCase();
      
      // البحث في أسماء العاملات
      const homemaids = await prisma.homemaid.findMany({
        where: {
          Name: {
            contains: query,
            // mode: 'insensitive',
          },
        },
        select: {
          id: true,
          Name: true,
          office: {
            select: {
              Country: true,
            },
          },
          Religion: true,
        },
        take: 10,
      });

      const suggestions = homemaids.map(homemaid => ({
        id: homemaid.id,
        Name: homemaid.Name,
        Country: homemaid.office?.Country || '',
        religion: homemaid.Religion || '',
      }));

      res.status(200).json({ suggestions });
    } catch (error) {
      console.error("Error fetching homemaid suggestions:", error);
      res.status(500).json({ error: "Error fetching homemaid suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
