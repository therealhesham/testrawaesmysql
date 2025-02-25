import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method == "GET") {
      const { searchTerm, page, office } = req.query;
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      const filters: any = {};
      if (office) filters.HomeMaid = { officeName: office };
      if (searchTerm) {
        filters.AND = [
          {
            OR: [
              {
                ClientName: {
                  contains: searchTerm
                    ? (searchTerm as string).toLowerCase()
                    : "",
                },
              },
              {
                Name: {
                  contains: searchTerm
                    ? (searchTerm as string).toLowerCase()
                    : "",
                },
              },
            ],
          },
        ];
      }

      // 1. استرجاع الـ neworders
      // استعلام SQL لحساب الرصيد المتبقي
      const homemaids = await prisma.$queryRaw`
-- SET NAMES 'utf8' COLLATE 'utf8_general_ci';
		SELECT 
    CAST(COUNT(*) AS CHAR) AS count
FROM (
    SELECT 
        h.Name,
        h.officeName,
        o.Country,
        a.KingdomentryDate,
        a.KingdomentryTime,
        no.createdAt,
        no.clientID,
        no.id,
        no.ClientName,
        no.clientphonenumber,
        no.PhoneNumber
    FROM 
        neworder no
    LEFT JOIN 
        transactions t ON no.id = t.order_id
    LEFT JOIN
        arrivallist a ON no.id = a.OrderId
    LEFT JOIN 
        homemaid h ON h.id = no.HomemaidId
    LEFT JOIN
        offices o ON o.office = h.officeName
    GROUP BY 
        no.id, 
        a.KingdomentryDate, 
        a.KingdomentryTime, 
        no.createdAt,
        no.clientID,
        no.clientphonenumber,
        no.ClientName, 
        no.PhoneNumber,
        a.InternalmusanedContract, 
        h.officeName,
        h.Name, 
        o.Country
    ORDER BY 
        no.id DESC
) AS subquery;

        `;
      console.log(homemaids);
      // إضافة ال

      // 3. إرجاع البيانات مع الرصيد المتبقي
      // res.status(200).json(homemaids);
    }
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
