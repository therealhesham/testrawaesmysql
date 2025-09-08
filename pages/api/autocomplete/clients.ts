import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";
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


      const clients = await prisma.client.findMany({
        orderBy: { id: "desc" },
     
      });

      res.status(200).json({
        data: clients,
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