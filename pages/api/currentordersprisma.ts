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
        officeName,
        bookingstatus,
      } = req.query;

      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      if (pageNumber < 1) {
        return res.status(400).json({ error: "Page number must be positive" });
      }

      const filters: any = {};

      if (Passportnumber) filters.Passportnumber = { contains: Passportnumber };
      if (clientphonenumber) filters.clientphonenumber = { contains: clientphonenumber };
      if (HomemaidId) filters.HomemaidId = { equals: Number(HomemaidId) };
      if (age) filters.age = { equals: parseInt(age as string, 10) };
      if (Nationalitycopy) filters.HomeMaid=  
         {office:{Country:{ contains: Nationalitycopy as string }}} 
      

      if (typeOfContract) {
        filters.typeOfContract = { equals: typeOfContract };
      }
      if (officeName) {
        filters.HomeMaid = { office: { office: { contains: officeName as string } } };
      }
      if (bookingstatus) {
        filters.bookingstatus = { equals: bookingstatus };
      }
      if (searchTerm) {
        filters.OR = [
          { ClientName: { contains: searchTerm as string } },
          { Passportnumber: { contains: searchTerm as string } },
          { clientphonenumber: { contains: searchTerm as string } },
        ];
      }
console.log(filters)
      const homemaids = await prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          arrivals: { select: { InternalmusanedContract: true } },
          HomeMaid: { include: { office: true } },
          client: true,
        },
        where: {
          ...filters,
          NOT: {
            bookingstatus: {
              in: ["new_order", "new_orders", "delivered", "cancelled","rejected"],
            },
          },
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      const totalCount = await prisma.neworder.count({
        where: {
          ...filters,
          NOT: {
            bookingstatus: {
              in: ["new_order", "new_orders", "delivered", "cancelled","rejected"],
            },
          },
        },
      });

      const recruitment = await prisma.neworder.count({
        where: {
          typeOfContract: "recruitment",
          NOT: {
            bookingstatus: {
              in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
            },
          },
        },
      });

      const rental = await prisma.neworder.count({
        where: {
          typeOfContract: "rental",
          NOT: {
            bookingstatus: {
              in: ["new_order", "new_orders", "delivered", "cancelled", "rejected"],
            },
          },
        },
      });

      return res.status(200).json({
        homemaids,
        recruitment,
        rental,
        totalPages: Math.ceil(totalCount / pageSize),
      });
    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: { bookingstatus: "الاستلام" },
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