import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { SponsorName, age, PassportNumber, page, OrderId,search, perPage, nationality, deparatureDate } =
      req.query;

    const pageSize = parseInt(perPage as string, 10) || 10;
    const pageNumber = parseInt(page as string, 10) || 1;

    const filters: any = {};
    if (OrderId) filters.OrderId = { equals: Number(OrderId) };
    if (SponsorName)
      filters.SponsorName = {
        contains: (SponsorName as string).toLowerCase(),
        // mode: "insensitive",
      };
    if (PassportNumber)
      filters.PassportNumber = {
        contains: (PassportNumber as string).toLowerCase(),
      };
      if(search){
        filters.OR = [
          { Order: { client: { fullname: { contains: (search as string).toLowerCase() } } } },
          { Order: { HomeMaid: { Name: { contains: (search as string).toLowerCase() } } } },

          { PassportNumber: { contains: (search as string).toLowerCase() } },
          { OrderId: { equals: Number(search) } },
        ];
      }
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
    if (nationality)
      filters.Order = {
        HomeMaid: {
          office: {
            Country: {
              contains: (nationality as string).toLowerCase(),
            },
          },
        },
      };
    if (deparatureDate)
      filters.internaldeparatureDate = {
        equals: new Date(deparatureDate as string),
      };

    try {
      const totalRecords = await prisma.arrivallist.count({
        where: {
          ...filters,
          internaldeparatureDate: { not: null },
        },
      });
      const totalPages = Math.ceil(totalRecords / pageSize);

      const homemaids = await prisma.arrivallist.findMany({
        where: {
          ...filters,
          internaldeparatureDate: { not: null },
        },
        select: {
          Sponsor: true,
          Order: {
            select: {
              Name: true,
              HomemaidId: true,
              HomeMaid: {

                include: { office: { select: { Country: true } },Client:{select:{fullname:true}} },
              },
            },
          },
          OrderId: true,
          SponsorName: true,
          PassportNumber: true,
          internaldeparatureDate: true,
          internaldeparatureTime: true,
          SponsorPhoneNumber: true,
          createdAt:true,
          updatedAt:true,
          internalReason: true,
          HomemaidName: true,
          id: true,
          // الحقول الجديدة للمغادرة الداخلية
          internaldeparatureCity: true,
        
          internalArrivalCity: true,
          internalArrivalCityDate: true,
          internalArrivalCityTime: true,
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "desc" },
      });

      res.status(200).json({
        data: homemaids,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "Error fetching data" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "POST") {
    try {
      const {
        SponsorName,
        age,
        PassportNumber,
        OrderId,
        deparatureDate,
        deparatureTime,
        SponsorPhoneNumber,
        HomemaidName,
      } = req.body;

      const newRecord = await prisma.arrivallist.create({
        data: {
          SponsorName,
          PassportNumber,
          OrderId,
          internaldeparatureDate: deparatureDate,
          internaldeparatureTime: deparatureTime,
          SponsorPhoneNumber,
          HomemaidName,
        },
      });

      res.status(201).json({ message: "Record created successfully", data: newRecord });
    } catch (error) {
      console.error("Error creating record:", error);
      res.status(500).json({ error: "Error creating record" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}