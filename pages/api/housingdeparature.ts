import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { page = 1, sortKey, sortDirection, contractType } = req.query;
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      let orderBy: any = { id: "desc" };
      if (sortKey) {
        switch (sortKey) {
          case "Name":
            orderBy = { Order: { Name: sortDirection || "asc" } };
            break;
          case "phone":
            orderBy = { Order: { phone: sortDirection || "asc" } };
            break;
          case "Details":
            orderBy = { Details: sortDirection || "asc" };
            break;
          case "Nationalitycopy":
            orderBy = { Order: { Nationalitycopy: sortDirection || "asc" } };
            break;
          default:
            orderBy = { id: "desc" };
        }
      }

      const filters: any = {
        deparatureHousingDate: { not: null },
      };

      // Add contract type filter if provided
      if (contractType) {
        filters.Order = {
          NewOrder: {
            some: {
              typeOfContract: contractType as string
            }
          }
        };
      }

      const housing = await prisma.housedworker.findMany({
        where: filters,
        include: { 
          Order: {
            include: {
              NewOrder: true
            }
          }
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: orderBy,
      });

      const totalCount = await prisma.housedworker.count({
        where: filters,
      });

      res.status(200).json({ 
        housing,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      });
    } catch (error) {
      console.error("Error fetching departed workers:", error);
      res.status(500).json({ error: "Error fetching departed workers" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "PUT") {
    console.log(req.body)
    try {
      // Fetch data 
        await prisma.housedworker.update({
          where: {id: Number(req.body.homeMaid) },
          data: {
            isActive: false,
            deparatureReason:req.body.deparatureReason ,
            deparatureHousingDate: req.body.deparatureHousingDate?new Date(req.body.deparatureHousingDate).toISOString():"",
            checkIns: {
              updateMany: {
                where: { isActive: true }, // Add appropriate conditions here
                data: { isActive: false },
              },
            },
          },
        });

        res.status(201).json("sss");
      
    } catch (error) {
      console.error("Error updating data:", error);
      res.status(500).json({ error: "Error updating data" });
    } finally {
      // Disconnect Prisma Client regardless of success or failure
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
