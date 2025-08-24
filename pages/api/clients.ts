import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const { fullname, phonenumber, nationalId, city, clientSource } = req.body;

      // Basic validation
      if (!fullname || !phonenumber || !nationalId) {
        return res.status(400).json({ message: "الاسم، رقم الهاتف، والهوية مطلوبة" });
      }

      const client = await prisma.client.create({
        data: {
          fullname,
          phonenumber,
          nationalId,
          city,
          // createdAt: new Date(),
        },
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
      const { fullname, phonenumber, city, date, clientId } = req.query;
      const filters: any = {};

      if (clientId) {
        // جلب عميل واحد بناءً على clientId
        filters.id = parseInt(clientId as string);
      } else {
        // تطبيق الفلاتر الأخرى لجلب قائمة العملاء
        if (fullname) filters.fullname = { contains: fullname as string };
        if (phonenumber) filters.phonenumber = { contains: phonenumber as string };
        if (city && city !== "all") filters.city = city as string;
        if (date && !isNaN(new Date(date as string).getTime())) {
          const start = new Date(date as string);
          start.setHours(0, 0, 0, 0);
          const end = new Date(date as string);
          end.setHours(23, 59, 59, 999);
          filters.createdAt = { gte: start, lte: end };
        }
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = 10;
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

      res.status(200).json({
        data: clients,
        totalPages: clientId ? 1 : Math.ceil(totalClients / pageSize),
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