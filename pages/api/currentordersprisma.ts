import '../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

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
      if (age) {
        const ageNum = parseInt(age as string, 10);
        if (!isNaN(ageNum)) {
          // Calculate birth year directly from current year minus age
          const currentYear = new Date().getFullYear();
          const targetBirthYear = currentYear - ageNum;
          
          // Search for birth year with tolerance of ±2 years
          filters.dateofbirth = {
            gte: new Date(`${targetBirthYear - 2}-01-01T00:00:00.000Z`).toISOString(),
            lte: new Date(`${targetBirthYear + 2}-12-31T23:59:59.999Z`).toISOString(),
          };
        }
      }
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



const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }
    console.log(cookies.authToken)
    const token = jwtDecode(cookies.authToken);

    eventBus.emit('ACTION', {
        type: ' عرض صفحة طلبات تحت الاجراء ',
        userId: Number(token.id),
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