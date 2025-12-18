import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const startDate = (req.query.startDate as string)?.trim() || "";
      const endDate = (req.query.endDate as string)?.trim() || "";
const rawSearch = req.query.search;
const search =
  rawSearch && rawSearch !== "undefined" && rawSearch !== "null"
    ? (rawSearch as string).trim()
    : "";

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
      // نفلتر CheckIn ضمن النطاق الزمني في الـ JOIN نفسه، وليس في WHERE
      const data = await prisma.$queryRawUnsafe<any[]>(
        `
        SELECT 
          hw.id,
          h.id as homemaid_id,
          h.Name AS Name,
          hw.employee,
          hw.houseentrydate,
          hw.isActive,
          ci.CheckDate,
          CAST(IFNULL(ci.DailyCost, 0) AS DECIMAL(10,2)) AS DailyCost
        FROM housedworker hw
        INNER JOIN homemaid h ON hw.homeMaid_id = h.id
        LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId 
          AND DATE(ci.CheckDate) BETWEEN ? AND ?
        WHERE (h.Name LIKE ? OR ? = '')
          AND hw.isActive = true
        ORDER BY h.Name, ci.CheckDate;
        `,
        startDateString,
        endDateString,
        searchPattern,
        search
      );

      // تجميع البيانات حسب العاملة واليوم
      const workersMap = new Map();
      const dailyTotals: { [key: string]: number } = {};

      for (const row of data) {
        const workerId = row.id;
        if (!workersMap.has(workerId)) {
          workersMap.set(workerId, {
            id: workerId,
            homemaid_id: row.homemaid_id,
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

      // Get user info for logging
      const cookieHeader = req.headers.cookie;
      let userId: number | null = null;
      if (cookieHeader) {
        try {
          const cookies: { [key: string]: string } = {};
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
          if (cookies.authToken) {
            const token = jwtDecode(cookies.authToken) as any;
            userId = Number(token.id);
          }
        } catch (e) {
          // Ignore token errors
        }
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

      // تسجيل الحدث
      if (userId && deleteResult) {
        eventBus.emit('ACTION', {
          type: `حذف ${deleteResult} سجل من جدول الحضور - التاريخ: ${dateString}`,
          actionType: 'delete',
          userId: userId,
        });
      }

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