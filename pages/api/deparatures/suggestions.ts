import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    try {
      const query = (q as string).toLowerCase();
      
      // البحث في أسماء العاملات
      const homeMaidNames = await prisma.arrivallist.findMany({
        where: {
          internaldeparatureDate: { not: null },
          HomemaidName: {
            contains: query,
            // mode: "insensitive",
          },
        },
        select: {
          HomemaidName: true,
        },
        distinct: ['HomemaidName'],
        take: 5,
      });

      // البحث في أسماء العملاء
      const clientNames = await prisma.arrivallist.findMany({
        where: {
          internaldeparatureDate: { not: null },
          SponsorName: {
            contains: query,
            // mode: "insensitive",
          },
        },
        select: {
          SponsorName: true,
        },
        distinct: ['SponsorName'],
        take: 5,
      });

      // البحث في أرقام الجوازات
      const passportNumbers = await prisma.arrivallist.findMany({
        where: {
          internaldeparatureDate: { not: null },
          PassportNumber: {
            contains: query,
            // mode: "insensitive",
          },
        },
        select: {
          PassportNumber: true,
        },
        distinct: ['PassportNumber'],
        take: 5,
      });

      // البحث في أرقام الطلبات
      const orderIds = await prisma.arrivallist.findMany({
        where: {
          internaldeparatureDate: { not: null },
          OrderId: {
            equals: isNaN(Number(query)) ? -1 : Number(query),
          },
        },
        select: {
          OrderId: true,
        },
        distinct: ['OrderId'],
        take: 5,
      });

      // دمج النتائج وإزالة التكرار
      const suggestions = new Set<string>();
      
      homeMaidNames.forEach(item => {
        if (item.HomemaidName) {
          suggestions.add(item.HomemaidName);
        }
      });
      
      clientNames.forEach(item => {
        if (item.SponsorName) {
          suggestions.add(item.SponsorName);
        }
      });
      
      passportNumbers.forEach(item => {
        if (item.PassportNumber) {
          suggestions.add(item.PassportNumber);
        }
      });
      
      orderIds.forEach(item => {
        if (item.OrderId) {
          suggestions.add(item.OrderId.toString());
        }
      });

      const suggestionsArray = Array.from(suggestions).slice(0, 10);

      res.status(200).json({ suggestions: suggestionsArray });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: "Error fetching suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
