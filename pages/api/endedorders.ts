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
    ratingStatus,
    starsCount,
    fromDate,
    toDate,
    warrantyStatus,
    page,
    HomemaidId,
    perPage,
  } = req.query;

  const pageSize = perPage ? parseInt(perPage as string, 10) : 10;
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
      const currentYear = new Date().getFullYear();
      const targetBirthYear = currentYear - ageNum;
      filters.dateofbirth = {
        gte: `${targetBirthYear - 2}-01-01`,
        lte: `${targetBirthYear + 2}-12-31`,
      };
    }
  }

  if (Nationalitycopy) filters.Nationalitycopy = { contains: (Nationalitycopy as string).toLowerCase() };
  if (typeOfContract) filters.typeOfContract = { equals: typeOfContract };

  if (searchTerm) {
    const termStr = String(searchTerm).trim();
    const idStr = termStr.replace(/^#/, "").trim();
    const idNum = /^\d+$/.test(idStr) ? parseInt(idStr, 10) : NaN;
    filters.OR = [
      { HomeMaid: { Name: { contains: termStr } } },
      { ClientName: { contains: termStr } },
      { client: { fullname: { contains: termStr } } },
      { client: { nationalId: { contains: termStr } } },
      { nationalId: { contains: termStr } },
      { Passportnumber: { contains: termStr } },
      { clientphonenumber: { contains: termStr } },
      { client: { phonenumber: { contains: termStr } } },
      ...(Number.isFinite(idNum) && !Number.isNaN(idNum) ? [{ id: idNum }] : []),
    ];
  }

  // Filter by HomeMaid office Country (where nationality is actually stored)
  if (Nationality) {
    filters.AND = [
      ...(filters.AND || []),
      {
        HomeMaid: {
          office: {
            Country: {
              contains: Nationality as string,
            },
          },
        },
      },
    ];
  }

  // 1. & 2. Rating Filters
  if (ratingStatus === 'rated') {
    filters.ratings = { some: { isRated: true } };
  } else if (ratingStatus === 'unrated') {
    filters.ratings = { none: { isRated: true } };
  }

  if (starsCount && starsCount !== 'all' && starsCount !== '') {
    const starsNum = parseInt(starsCount as string, 10);
    if (!isNaN(starsNum)) {
      if (!filters.ratings) {
        filters.ratings = { some: { stars: starsNum } };
      } else if (filters.ratings.some) {
        filters.ratings.some.stars = starsNum;
      }
    }
  }

  // 3. Date Filter (Delivery Date)
  if (fromDate || toDate) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate as string);
    if (toDate) {
      const end = new Date(toDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    filters.DeliveryDetails = {
      some: {
        deliveryFile: { not: null },
        deliveryDate: dateFilter,
      },
    };
  }

  // 4. Warranty Filter
  if (warrantyStatus && warrantyStatus !== 'all' && warrantyStatus !== '') {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    if (warrantyStatus === 'valid') {
      filters.AND = [
        ...(filters.AND || []),
        { isContractEnded: { not: true } },
        { arrivals: { some: { KingdomentryDate: { gte: ninetyDaysAgo } } } }
      ];
    } else if (warrantyStatus === 'expired') {
      filters.AND = [
        ...(filters.AND || []),
        {
          OR: [
            { isContractEnded: true },
            { arrivals: { some: { KingdomentryDate: { lt: ninetyDaysAgo } } } },
            { arrivals: { none: {} } }
          ]
        }
      ];
    }
  }

  // جلب البيانات - الطلبات المكتملة هي التي لديها ملف استلام
  const homemaids = await prisma.neworder.findMany({
    include: {
      HomeMaid: {
        include: {
          office: true,
        },
      },
      client: true,
      ratings: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      arrivals: {
        select: {
          KingdomentryDate: true,
          GuaranteeDurationEnd: true,
          DateOfApplication: true,
        },
      },
      DeliveryDetails: {
        where: {
          deliveryFile: { not: null },
          deliveryDate: { not: null },
        },
        orderBy: { id: 'desc' },
        take: 1,
        select: { deliveryDate: true },
      },
    },
    orderBy: { id: "desc" },
    where: {
      ...filters,
      // الطلب مكتمل عندما يكون لديه DeliveryDetails مع deliveryFile موجود
      DeliveryDetails: filters.DeliveryDetails || {
        some: {
          deliveryFile: {
            not: null,
          },
        },
      },
    },
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
  });

  const totalCount = await prisma.neworder.count({
    where: {
      ...filters,
      // الطلب مكتمل عندما يكون لديه DeliveryDetails مع deliveryFile موجود
      DeliveryDetails: filters.DeliveryDetails || {
        some: {
          deliveryFile: {
            not: null,
          },
        },
      },
    },
  });

  // تسلسل كامل لضمان وصول createdAt وجميع التواريخ للفرونت
  const serialized = JSON.parse(
    JSON.stringify(homemaids, (_, v) => (v instanceof Date ? v.toISOString() : v))
  );

  return res.status(200).json({
    homemaids: serialized,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  });
}
 else if (req.method === "POST") {
      const updatedOrder = await prisma.neworder.update({
        where: { id: Number(req.body.id) },
        data: { bookingstatus: "received" },
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