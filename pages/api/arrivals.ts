import '../../lib/loggers';
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";
// import '../../lib/loggers';
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { search, age, ArrivalCity, KingdomentryDate, page } = req.query;
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

  // Set the page size for pagination
  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  // Build the filter object dynamically based on query parameters
  const filters: any = {};
  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filters.OR = [
      { SponsorName: { contains: searchTerm } },
      { PassportNumber: { contains: searchTerm } },
      { OrderId: { equals: parseInt(searchTerm, 10) || undefined } },
    ];
  }
  if (age)
    filters.Order = { HomeMaid: { age: { equals: parseInt(age as string, 10) } } };
  if (ArrivalCity)
    filters.arrivalSaudiAirport = { contains: (ArrivalCity as string).toLowerCase() };

   if (KingdomentryDate) {
  const parsed = new Date(KingdomentryDate as string);
  if (!isNaN(parsed.getTime())) {
    const startOfDay = new Date(parsed);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsed);
    endOfDay.setHours(23, 59, 59, 999);

    filters. KingdomentryDate = {
      gte: startOfDay,
      lte: endOfDay,
      not: null,
    };
  }
} else {
  // لو مفيش فلترة على التاريخ، نحط بس not null عشان البيانات تكون منطقية
  filters.KingdomentryDate = { not: null };
}
//  if (KingdomentryDate && KingdomentryDate !== '') {
//   const inputDate = new Date(KingdomentryDate as string);
//   if (!isNaN(inputDate.getTime())) {
//     const startOfDay = new Date(inputDate.setHours(0, 0, 0, 0)).toISOString();
//     const endOfDay = new Date(inputDate.setHours(23, 59, 59, 999)).toISOString();
//     filters.KingdomentryDate = {
//       gte: startOfDay,
//       lte: endOfDay,
//     };
//   } else {
//     console.error('Invalid date format for KingdomentryDate:', KingdomentryDate);
//   }
// }

  try {
    // Get total count of records matching the filters
    const totalRecords = await prisma.arrivallist.count({
      where: {
        ...filters,
        // KingdomentryDate: { not: null },
        Order: { isNot: null }, // تأكد من وجود Order مرتبط
      },
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Fetch data with the filters and pagination
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        ...filters,
        // KingdomentryDate: { not: null },
        Order: { isNot: null }, // تأكد من وجود Order مرتبط
      },
      select: {
        Order: {
          select: {
            client:{select:{fullname:true}},
            Name: true,
            ClientName: true,
            HomeMaid: {
              select: { Name: true, Passportnumber: true, id: true, office: true, age: true },
            },
            clientphonenumber: true,
            id: true,
          },
        },
        OrderId: true,
        SponsorName: true,
        PassportNumber: true,
        KingdomentryDate: true,
        KingdomentryTime: true,
        DeliveryDate: true,
        arrivalSaudiAirport: true,
        deparatureCityCountry: true,
        deparatureCityCountryDate: true,
        deparatureCityCountryTime: true,
        medicalCheckFile: true,
        ticketFile: true,
        SponsorPhoneNumber: true,
        SponsorIdnumber: true,
        InternalmusanedContract: true,
        createdAt:true,
        updatedAt:true,
        HomemaIdnumber: true,
        HomemaidName: true,
        Notes: true,
        id: true,
      },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { id: "desc" },
    });


const referer = req.headers.referer || '/admin/arrivals';
console.log(referer)
      
    res.status(200).json({

      data: homemaids,
      totalPages,
    });
     eventBus.emit('ACTION', {
           type: "عرض قائمة الوصول " ,
           actionType: "view",
           beneficiary: "homemaid",
           pageRoute: referer,
          //  BeneficiaryId: homemaids.id,
           userId: Number((token as any).id),
         });  
   
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}