import '../../lib/loggers';
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";
// import '../../lib/loggers';
const prisma = new PrismaClient();

function convert12hTo24h(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const cleanStr = timeStr.trim().toUpperCase();
  
  // Detect PM if string contains 'PM' or 'م'
  const isPm = cleanStr.includes('PM') || cleanStr.includes('م');
  const isAm = cleanStr.includes('AM') || cleanStr.includes('ص');
  
  // Extract hours and minutes
  const match = /(\d{1,2}):(\d{2})/.exec(cleanStr);
  if (!match) return cleanStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  
  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;
  
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

const getArrivalTimestamp = (dateVal: any, timeStr: string | null | undefined): number => {
  if (!dateVal) return 0;
  let dateString = "";
  if (typeof dateVal === 'string') {
    dateString = dateVal.split('T')[0];
  } else if (dateVal instanceof Date) {
    const y = dateVal.getFullYear();
    const m = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    dateString = `${y}-${m}-${day}`;
  } else {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      dateString = `${y}-${m}-${day}`;
    }
  }
  if (!dateString) return 0;
  let hour = 0;
  let minute = 0;
  if (timeStr) {
    const cleanTime = convert12hTo24h(timeStr);
    const match = /(\d{1,2}):(\d{2})/.exec(cleanTime);
    if (match) {
      hour = parseInt(match[1], 10);
      minute = parseInt(match[2], 10);
    }
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
};

const isArrived = (dateVal: any, timeStr: string | null | undefined): boolean => {
  if (!dateVal) return false;
  const ts = getArrivalTimestamp(dateVal, timeStr);
  if (ts === 0) return false;
  return ts <= Date.now();
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { search, age, ArrivalCity, KingdomentryDate, page, startDate, endDate, fromCity, toCity, nationality } = req.query;
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
  
  const orderFilter: any = {};
  if (age) {
    orderFilter.HomeMaid = { ...orderFilter.HomeMaid, age: { equals: parseInt(age as string, 10) } };
  }
  if (nationality) {
    orderFilter.HomeMaid = {
      ...orderFilter.HomeMaid,
      office: { Country: { equals: nationality as string } }
    };
  }
  if (Object.keys(orderFilter).length > 0) {
    filters.Order = orderFilter;
  }

  if (fromCity) {
    filters.deparatureCityCountry = { contains: fromCity as string };
  }

  const targetToCity = toCity || ArrivalCity;
  if (targetToCity) {
    filters.arrivalSaudiAirport = { contains: targetToCity as string };
  }

  if (startDate || endDate) {
    filters.KingdomentryDate = {};
    if (startDate) {
      const parsedStart = new Date(startDate as string);
      if (!isNaN(parsedStart.getTime())) {
        filters.KingdomentryDate.gte = parsedStart;
      }
    }
    if (endDate) {
      const parsedEnd = new Date(endDate as string);
      if (!isNaN(parsedEnd.getTime())) {
        parsedEnd.setHours(23, 59, 59, 999);
        filters.KingdomentryDate.lte = parsedEnd;
      }
    }
    filters.KingdomentryDate.not = null;
  } else if (KingdomentryDate) {
    const parsed = new Date(KingdomentryDate as string);
    if (!isNaN(parsed.getTime())) {
      const startOfDay = new Date(parsed);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsed);
      endOfDay.setHours(23, 59, 59, 999);

      filters.KingdomentryDate = {
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
    // Fetch ALL data with the filters for in-memory sorting
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        ...filters,
        Order: { isNot: null }, // تأكد من وجود Order مرتبط
      },
      select: {
        Order: {
          select: {
            client:{select:{fullname:true, id:true}},
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
    });

    const now = new Date();
    
    // تصنيف الرحلات إلى: لم تصل (في المستقبل) و وصلت (في الماضي أو الحاضر)
    const notArrived = homemaids.filter(item => !isArrived(item.KingdomentryDate, item.KingdomentryTime));
    const arrived = homemaids.filter(item => isArrived(item.KingdomentryDate, item.KingdomentryTime));

    // ترتيب التي لم تصل: من الأقرب تاريخاً إلى الأبعد (تصاعدي)
    notArrived.sort((a, b) => {
      const dateA = getArrivalTimestamp(a.KingdomentryDate, a.KingdomentryTime);
      const dateB = getArrivalTimestamp(b.KingdomentryDate, b.KingdomentryTime);
      return dateA - dateB;
    });

    // ترتيب التي وصلت: من الأحدث وصولاً إلى الأقدم (تنازلي)
    arrived.sort((a, b) => {
      const dateA = getArrivalTimestamp(a.KingdomentryDate, a.KingdomentryTime);
      const dateB = getArrivalTimestamp(b.KingdomentryDate, b.KingdomentryTime);
      return dateB - dateA;
    });

    const sortedAll = [...notArrived, ...arrived];
    const totalCount = sortedAll.length;
    const arrivedCount = arrived.length;
    const pendingCount = notArrived.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginatedData = sortedAll.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    const referer = req.headers.referer || '/admin/arrivals';
    console.log(referer);
      
    res.status(200).json({
      data: paginatedData,
      totalPages,
      totalCount,
      arrivedCount,
      pendingCount,
    });

    eventBus.emit('ACTION', {
      type: "عرض قائمة الوصول ",
      actionType: "view",
      beneficiary: "homemaid",
      pageRoute: referer,
      userId: Number((token as any).id),
    });  
   
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}