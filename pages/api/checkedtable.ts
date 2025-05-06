import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const startDate = (req.query.startDate as string)?.trim() || "";
      const endDate = (req.query.endDate as string)?.trim() || "";
      const search = (req.query.search as string)?.trim() || "";
      const searchPattern = `%${search}%`;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "تاريخ البداية وتاريخ النهاية مطلوبان." });
      }

      // تحويل التواريخ إلى تنسيق صالح
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "تاريخ بداية أو نهاية غير صالح." });
      }

      // التأكد من أن تاريخ البداية لا يسبق تاريخ النهاية
      if (start > end) {
        return res.status(400).json({ message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية." });
      }

      const startDateString = start.toISOString().split("T")[0];
      const endDateString = end.toISOString().split("T")[0];

      // استعلام لجلب البيانات
      const data = await prisma.$queryRawUnsafe(
        `
        SELECT 
          hw.id,
          h.Name AS Name,
          hw.employee,
          hw.houseentrydate,
          hw.isActive,
          ci.CheckDate,
          CAST(IFNULL(ci.DailyCost, 0) AS DECIMAL(10,2)) AS DailyCost
        FROM housedworker hw
        INNER JOIN homemaid h ON hw.homeMaid_id = h.id
        LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId
        WHERE (h.Name LIKE ? OR ? = '')
          AND hw.isActive = true
          AND (ci.CheckDate IS NULL OR (DATE(ci.CheckDate) BETWEEN ? AND ?))
        ORDER BY h.Name, ci.CheckDate;
        `,
        searchPattern,
        search,
        startDateString,
        endDateString
      );

      // تجميع البيانات حسب العاملة واليوم
      const workersMap = new Map();
      const dailyTotals: { [key: string]: number } = {};

      for (const row of data) {
        const workerId = row.id;
        if (!workersMap.has(workerId)) {
          workersMap.set(workerId, {
            id: workerId,
            Name: row.Name,
            employee: row.employee,
            houseentrydate: row.houseentrydate,
            isActive: row.isActive,
            dailyCosts: {},
          });
        }

        if (row.CheckDate) {
          const checkDate = new Date(row.CheckDate).toISOString().split("T")[0];
          workersMap.get(workerId).dailyCosts[checkDate] = Number(row.DailyCost);

          // حساب إجمالي اليوم
          if (!dailyTotals[checkDate]) {
            dailyTotals[checkDate] = 0;
          }
          dailyTotals[checkDate] += Number(row.DailyCost);
        }
      }

      const workers = Array.from(workersMap.values());

      res.status(200).json({
        startDate: startDateString,
        endDate: endDateString,
        workers,
        dailyTotals,
      });
    } else if (req.method === "DELETE") {
      const { date } = req.query;

      if (!date || typeof date !== "string") {
        return res.status(400).json({ message: "التاريخ مطلوب ويجب أن يكون نصًا." });
      }

      // تحويل التاريخ إلى تنسيق صالح (YYYY-MM-DD)
      const formattedDate = new Date(date);
      if (isNaN(formattedDate.getTime())) {
        return res.status(400).json({ message: "تاريخ غير صالح." });
      }
      const dateString = formattedDate.toISOString().split("T")[0];

      // حذف السجلات من جدول CheckIn بناءً على CheckDate
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM CheckIn
        WHERE DATE(CheckDate) = ${dateString};
      `;

      res.status(200).json({
        message: `تم حذف ${deleteResult} سجل بنجاح.`,
      });
    } else {
      res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}