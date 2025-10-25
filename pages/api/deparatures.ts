import '../../lib/loggers';

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { parse, isValid } from "date-fns";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { SponsorName, age, PassportNumber, page, OrderId,search, perPage, nationality, deparatureDate } =
      req.query;
const tryParseDate = (input: string): Date | null => {
  const formats = ["yyyy-MM-dd", "dd-MM-yyyy", "dd MMM yyyy"];

  for (const format of formats) {
    const parsed = parse(input, format, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }

  return null;
};
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
      try{
//  const parsedDate = tryParseDate(deparatureDate as string);
if (deparatureDate) {
  const parsed = new Date(deparatureDate as string);
  if (!isNaN(parsed.getTime())) {
    const startOfDay = new Date(parsed);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsed);
    endOfDay.setHours(23, 59, 59, 999);

    filters.internaldeparatureDate = {
      gte: startOfDay,
      lte: endOfDay,
      not: null,
    };
  }
} else {
  // لو مفيش فلترة على التاريخ، نحط بس not null عشان البيانات تكون منطقية
  filters.internaldeparatureDate = { not: null };
}

} catch (error) {
  console.error("Error parsing date:", error);
}


    try {
      const totalRecords = await prisma.arrivallist.count({
        where: filters,
      });
      const totalPages = Math.ceil(totalRecords / pageSize);

      const homemaids = await prisma.arrivallist.findMany({
        where:filters,
        select: {
          Sponsor: true,
          Order: {
            select: {client:true,
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

      try {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  const referer = req.headers.referer
  const token = jwtDecode(cookies.authToken);
  eventBus.emit('ACTION', {
    type: "عرض قائمة المغادرات ",
    beneficiary: "deparatures",
    pageRoute: referer,
    actionType: "view",
    userId: Number((token as any).id),
  });
} catch (error) {
  console.error("Error emitting event:", error);
}

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