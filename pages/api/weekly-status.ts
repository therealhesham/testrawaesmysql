import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const {
        Name,
        age,
        Passportnumber,
        id,
        Nationality,
        page,
        sortKey,
        sortDirection,
      } = req.query;
      const pageSize = 10;
      const pageNumber = parseInt(page as string, 10) || 1;
      // جلب جميع السجلات من جدول weeklyStatus
      const weeklyStatuses = await prisma.weeklyStatus.findMany({
        skip: (pageNumber - 1) * pageSize,
        take: 10,
        orderBy: {
          id: "desc", // ترتيب السجلات حسب التاريخ بشكل تنازلي
        },
        include: {
          HomeMaid: true, // جلب بيانات العاملة المرتبطة
        },
      });
      return res.status(200).json(weeklyStatuses);
    }

    if (req.method === "POST") {
      // إضافة سجل جديد إلى جدول weeklyStatus
      const { homeMaid_id, status, date, employee } = req.body;

      if (!status) {
        return res
          .status(400)
          .json({ error: "homeMaid_id and status are required" });
      }

      const newWeeklyStatus = await prisma.weeklyStatus.create({
        data: {
          employee,
          homeMaid_id: req.body.ID,
          status,
          date: date ? new Date(date) : undefined,
        },
      });

      return res.status(201).json(newWeeklyStatus);
    }

    // إذا كانت الطريقة غير مدعومة
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error in weeklyStatus API:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
