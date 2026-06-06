import '../../lib/loggers';
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { SponsorName, age, PassportNumber, page, OrderId, search, perPage, nationality, deparatureDate, startDate, endDate, fromCity, toCity } =
      req.query;
console.log(req.query);
    const pageSize = parseInt(perPage as string, 10) || 10;
    const pageNumber = parseInt(page as string, 10) || 1;

    const filters: any = {};
    if (fromCity) filters.externaldeparatureCity = { equals: fromCity };
    if (toCity) filters.externalArrivalCity = { equals: toCity };
    if (OrderId) filters.OrderId = { equals: Number(OrderId) };
    if (SponsorName)
      filters.SponsorName = {
        contains: (SponsorName as string).toLowerCase(),
        mode: "insensitive",
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

    if (startDate || endDate) {
      filters.externaldeparatureDate = {};
      if (startDate) {
        const parsedStart = new Date(startDate as string);
        if (!isNaN(parsedStart.getTime())) {
          filters.externaldeparatureDate.gte = parsedStart;
        }
      }
      if (endDate) {
        const parsedEnd = new Date(endDate as string);
        if (!isNaN(parsedEnd.getTime())) {
          parsedEnd.setHours(23, 59, 59, 999);
          filters.externaldeparatureDate.lte = parsedEnd;
        }
      }
      filters.externaldeparatureDate.not = null;
    } else if (deparatureDate) {
      const parsed = new Date(deparatureDate as string);
      if (!isNaN(parsed.getTime())) {
        const startOfDay = new Date(parsed);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(parsed);
        endOfDay.setHours(23, 59, 59, 999);

        filters.externaldeparatureDate = {
          gte: startOfDay,
          lte: endOfDay,
          not: null,
        };
      }
    } else {
      // لو مفيش فلترة على التاريخ، نحط بس not null عشان البيانات تكون منطقية
      filters.externaldeparatureDate = { not: null };
    }

    try {
      const totalRecords = await prisma.arrivallist.count({
        where: filters,
      });
      const totalPages = Math.ceil(totalRecords / pageSize);

      const homemaids = await prisma.arrivallist.findMany({
        where: filters,
        select: {
          Sponsor: true,
          Order: {
            select: {isContractEnded: true,
              Name: true,client:true,
              HomemaidId: true,
              HomeMaid: { 
                include: { office: { select: { Country: true } },Client:{select:{fullname:true}} },
              },
            },
          },
          OrderId: true,
          SponsorName: true,
          PassportNumber: true,
          SponsorPhoneNumber: true,
          externaldeparatureDate: true,
          externaldeparatureTime: true,
          id: true,
          externaldeparatureCity: true,
          externalArrivalCity: true,
          externalReason:true,
          externalArrivalCityDate: true,
          externalArrivalCityTime: true,
          KingdomentryDate: true,


        
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "desc" },
      });
console.log(homemaids);
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
        DeparatureFromSaudiDate,
        deparatureTime,
        SponsorPhoneNumber,
        HomemaidName,
      } = req.body;

      const newRecord = await prisma.arrivallist.create({
        data: {
          SponsorName,
          PassportNumber,
          OrderId,
          // DeparatureFromSaudiDate,
          // deparatureTime,
          SponsorPhoneNumber,
          HomemaidName,
        },
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
  const referer = req.headers.referer || '/admin/deparaturefromsaudi'
  const token = jwtDecode(cookies.authToken);
  eventBus.emit('ACTION', {
    type: "اضافة عاملة للمغادرة الخارجية",
    beneficiary: "homemaid",
    pageRoute: referer,
    actionType: "create",
    BeneficiaryId: newRecord.id || null,
    userId: Number((token as any).id),
  });
} catch (error) {
  console.error("Error emitting event:", error);
}


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



// export async function getServerSideProps ({ req }) {
//   try {
//     console.log("sss")
//     // 🔹 Extract cookies
//     const cookieHeader = req.headers.cookie;
//     let cookies: { [key: string]: string } = {};
//     if (cookieHeader) {
//       cookieHeader.split(";").forEach((cookie) => {
//         const [key, value] = cookie.trim().split("=");
//         cookies[key] = decodeURIComponent(value);
//       });
//     }

//     // 🔹 Check for authToken
//     if (!cookies.authToken) {
//       return {
//         redirect: { destination: "/admin/login", permanent: false },
//       };
//     }

//     // 🔹 Decode JWT
//     const token = jwtDecode(cookies.authToken);

//     // 🔹 Fetch user & role with Prisma
//     const findUser = await prisma.user.findUnique({
//       where: { id: token.id },
//       include: { role: true },
//     });
// console.log(findUser.role?.permissions?.["إدارة الطلبات"])
//     if (
//       !findUser ||
//       !findUser.role?.permissions?.["إدارة الوصول و المغادرة"]?.["عرض"]
//     ) {
//       return {
//         redirect: { destination: "/admin/home", permanent: false }, // or show 403
//       };
//     }

//     return { props: {} };
//   } catch (err) {
//     console.error("Authorization error:", err);
//     return {
//       redirect: { destination: "/admin/home", permanent: false },
//     };
//   }
// };