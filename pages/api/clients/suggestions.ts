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
      
      // البحث في أسماء العملاء
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            {
              fullname: {
                contains: query,
                // mode: 'insensitive',
              },
            },
            {
              phonenumber: {
                contains: query,
                // mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          city:true,
          fullname: true,
          phonenumber: true,
        },
        take: 10,
      });

      const suggestions = clients.map(client => ({
        id: client.id,
        city: client.city,
        fullname: client.fullname,
        phonenumber: client.phonenumber,
      }));

      res.status(200).json({ suggestions });
    } catch (error) {
      console.error("Error fetching client suggestions:", error);
      res.status(500).json({ error: "Error fetching client suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
