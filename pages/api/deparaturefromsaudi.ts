import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
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
    if (age) filters.age = { equals: parseInt(age as string, 10) };
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
      filters.externaldeparatureDate = {
        equals: new Date(deparatureDate as string),
      };

    try {
      const totalRecords = await prisma.arrivallist.count({
        where: {
          ...filters,
          externaldeparatureDate: { not: null },
        },
      });
      const totalPages = Math.ceil(totalRecords / pageSize);

      const homemaids = await prisma.arrivallist.findMany({
        where: {
          ...filters,
           externaldeparatureDate: { not: null },
        },
        select: {
          Sponsor: true,
          Order: {
            select: {isContractEnded: true,
              Name: true,
              HomemaidId: true,
              HomeMaid: {
                include: { office: { select: { Country: true } } },
              },
            },
          },
          OrderId: true,
          SponsorName: true,
          PassportNumber: true,
          externaldeparatureDate: true,
          externaldeparatureTime: true,
          SponsorPhoneNumber: true,
          HomemaidName: true,
          id: true,
        externaldeparatureCity: true,
        externalArrivalCity: true,
        externalReason:true,
        externalArrivalCityDate: true,
        externalArrivalCityTime: true,


        
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



export async function getServerSideProps ({ req }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
console.log(findUser.role?.permissions?.["إدارة الطلبات"])
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة الوصول و المغادرة"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};