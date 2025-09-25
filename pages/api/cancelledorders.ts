import '../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const {
        Passportnumber,
        searchTerm,
        age,
        clientphonenumber,
        Nationalitycopy,
        page,
        HomemaidId,
        ReasonOfRejection,
      } = req.query;

      console.log(req.query);
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;

      // Build the filter object dynamically based on query parameters
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
      if (ReasonOfRejection) filters.ReasonOfRejection = { contains: ReasonOfRejection };

      // Filter by offices.Country when Nationalitycopy is provided
      if (Nationalitycopy) {
        filters.HomeMaid = {
          office: {
            Country: {
              contains: (Nationalitycopy as string).toLowerCase(),
              mode: "insensitive", // Case-insensitive search
            },
          },
        };
      }

      // Fetch total count of matching records
      const totalCount = await prisma.neworder.count({
        where: {
          ...filters,
          bookingstatus: "cancelled",
        },
      });

      // Fetch paginated data with related fields
      const homemaids = await prisma.neworder.findMany({
        orderBy: { id: "desc" },
        where: {
          ...filters,
          bookingstatus: "cancelled",
        },
        include: {
          HomeMaid: {
            include: {
              office: true, // Include offices to get Country
            },
          },
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      });

      // Map the results to include Nationalitycopy from offices.Country
      const formattedData = homemaids.map((order) => ({
        ...order,
        Nationalitycopy: order.HomeMaid?.office?.Country || order.Nationalitycopy || "غير متوفر",
      }));


      
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
      
      
      // Send the filtered and paginated data along with total count
      res.status(200).json({
        data: formattedData,
        totalCount,
        pageSize,
        currentPage: pageNumber,
      });
    } else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: {
          bookingstatus: "cancelled",
          ReasonOfRejection: req.body.ReasonOfRejection,
          HomeMaid: { disconnect: true },
        },
      });
      res.status(200).json(updatedOrder);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}