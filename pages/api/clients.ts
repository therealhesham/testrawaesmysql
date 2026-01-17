import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { fullname, phonenumber, nationalId, city, clientSource, nationality, gender, profession, visaFile, visaNumber } = req.body;

      // Basic validation
      if (!fullname || !phonenumber || !nationalId) {
        return res.status(400).json({ message: "الاسم، رقم الهاتف، والهوية مطلوبة" });
      }

      const clientData: any = {
        fullname,
        phonenumber,
        nationalId,
        city,
        Source: clientSource,
      };

      // إنشاء التأشيرة فقط إذا كانت البيانات موجودة وليست فارغة
      if (visaNumber || nationality || gender || profession || visaFile) {
        clientData.visa = {
          create: {
            visaNumber: visaNumber || null,
            nationality: nationality || null,
            gender: gender || null,
            profession: profession || null,
            visaFile: visaFile || null,
          }
        };
      }

      const client = await prisma.client.create({
        data: clientData,
      });

      res.status(201).json({ message: "تم إضافة العميل بنجاح", client });
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "خطأ في الخادم الداخلي" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === "GET") {
    try {
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
      
      const { fullname, phonenumber, city, date, clientId, nationalId } = req.query;
      const filters: any = {};

      if (clientId) {
        // جلب عميل واحد بناءً على clientId
        filters.id = parseInt(clientId as string);
      } else {
        // تطبيق الفلاتر الأخرى لجلب قائمة العملاء
        const andConditions: any[] = [];
        
        if (fullname) {
          const searchTerm = decodeURIComponent(fullname as string);
          // البحث في الاسم أو رقم الهوية
          andConditions.push({
            OR: [
              { fullname: { contains: searchTerm } },
              { nationalId: { contains: searchTerm } }
            ]
          });
        }
        
        if (phonenumber) {
          andConditions.push({ phonenumber: { contains: decodeURIComponent(phonenumber as string) } });
        }
        
        if (nationalId && !fullname) {
          andConditions.push({ nationalId: { contains: decodeURIComponent(nationalId as string) } });
        }
        
        if (city && city !== "all" && city !== "") {
          const decodedCity = decodeURIComponent(city as string);
          console.log('City filter:', decodedCity);
          andConditions.push({ city: decodedCity });
        }
        
        if (date && !isNaN(new Date(date as string).getTime())) {
          const start = new Date(date as string);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date as string);
          end.setHours(23, 59, 59, 999);
          andConditions.push({ createdAt: { gte: start, lte: end } });
        }
        
        if (andConditions.length > 0) {
          filters.AND = andConditions;
        }
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
      const skip = (page - 1) * pageSize;
      
      const totalClients = await prisma.client.count({
        where: { ...filters },
      });

      const clients = await prisma.client.findMany({
        orderBy: { id: "desc" },
        where: { ...filters },
        select: {
          id: true,
          fullname: true,
          phonenumber: true,
          nationalId: true,
          city: true,
          email: true,
          createdAt: true,
          notes: true,
          notes_date: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            orderBy: { id: "desc" },
            include: { HomeMaid: true },
          },
        },
        ...(clientId ? {} : { skip, take: pageSize }), // إذا كان clientId موجود، لا نطبق التصفح
      });

      // بناء pageRoute مع query parameters
      // نستخدم referer إذا كان موجوداً (يحتوي على query params من المتصفح)
      // وإلا نبني URL من query parameters
      let pageRoute = '/admin/clients';
      
      if (req.headers.referer) {
        // استخراج pathname و query string من referer
        try {
          const refererUrl = new URL(req.headers.referer);
          // استخدام pathname + search (query params) + hash إذا كان موجوداً
          pageRoute = refererUrl.pathname + refererUrl.search + (refererUrl.hash || '');
        } catch (e) {
          // إذا فشل parsing، نستخدم referer كما هو
          pageRoute = req.headers.referer;
        }
      } else {
        // بناء URL من query parameters
        const queryParams = new URLSearchParams();
        queryParams.set('page', page.toString());
        if (fullname) queryParams.set('fullname', fullname as string);
        if (phonenumber) queryParams.set('phonenumber', phonenumber as string);
        if (nationalId) queryParams.set('nationalId', nationalId as string);
        if (city && city !== 'all') queryParams.set('city', city as string);
        if (date) queryParams.set('date', date as string);
        
        const queryString = queryParams.toString();
        pageRoute = queryString ? `/admin/clients?${queryString}` : '/admin/clients';
      }

  eventBus.emit('ACTION', {
           type: "عرض قائمة العملاء صفحة رقم "+ page,
           beneficiary: "client",
           pageRoute: pageRoute,
           actionType: "view",
           userId: Number(token.id),
         });  
   
      res.status(200).json({
        data: clients,
        totalPages: clientId ? 1 : Math.ceil(totalClients / pageSize),
        totalClients: totalClients,
      });
    } catch (error) {
      console.error("Error fetching clients data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}