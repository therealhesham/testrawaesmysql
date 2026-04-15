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
      const query = q as string;

      // البحث فقط في InternalmusanedContract من arrivallist
      const arrivals = await prisma.arrivallist.findMany({
        where: {
          InternalmusanedContract: {
            contains: query,
            // mode: "insensitive", // إذا كان Prisma يدعم case-insensitive
          },
        },
        select: {
          InternalmusanedContract: true,
          HomemaidName: true,
          PassportNumber: true,
          Order: {
            select: {
              HomeMaid: {
                select: {
                  Name: true,
                  Passportnumber: true,
                  office: {
                    select: {
                      office: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 20, // زيادة العدد للحصول على نتائج أكثر
        orderBy: {
          createdAt: 'desc', // الأحدث أولاً
        },
      });

      // إنشاء قائمة الاقتراحات مع تصفية case-insensitive
      const suggestionsMap = new Map<
        string,
        {
          contractNumber: string;
          officeName: string;
          maidName: string | null;
          passportNumber: string | null;
        }
      >();
      const queryLower = query.toLowerCase();

      const pickMaidName = (a: (typeof arrivals)[number]) =>
        a.Order?.HomeMaid?.Name?.trim() || a.HomemaidName?.trim() || null;
      const pickPassport = (a: (typeof arrivals)[number]) =>
        a.Order?.HomeMaid?.Passportnumber?.trim() || a.PassportNumber?.trim() || null;

      arrivals.forEach((arrival) => {
        if (arrival.InternalmusanedContract) {
          const contract = arrival.InternalmusanedContract;
          if (contract.toLowerCase().includes(queryLower)) {
            const officeName = arrival.Order?.HomeMaid?.office?.office || 'غير محدد';
            const maidName = pickMaidName(arrival);
            const passportNumber = pickPassport(arrival);
            const existing = suggestionsMap.get(contract);
            if (!existing) {
              suggestionsMap.set(contract, {
                contractNumber: contract,
                officeName,
                maidName,
                passportNumber,
              });
            } else {
              if (!existing.maidName && maidName) existing.maidName = maidName;
              if (!existing.passportNumber && passportNumber) {
                existing.passportNumber = passportNumber;
              }
            }
          }
        }
      });

      const suggestionsArray = Array.from(suggestionsMap.values()).slice(0, 10);
      res.status(200).json({ suggestions: suggestionsArray });
    } catch (error) {
      console.error("Error fetching contract suggestions:", error);
      res.status(500).json({ error: "Error fetching contract suggestions" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

