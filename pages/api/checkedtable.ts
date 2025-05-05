import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "GET") {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const search = (req.query.search as string)?.trim() || "";
      const checkDate = (req.query.checkDate as string)?.trim() || "";
      const offset = (page - 1) * pageSize;
      const searchPattern = `%${search}%`;

      // Prepare parameters for the query
      const params: any[] = [searchPattern, search, pageSize, offset];
      let dateCondition = "";
      if (checkDate) {
        const formattedDate = new Date(checkDate);
        if (isNaN(formattedDate.getTime())) {
          return res.status(400).json({ message: "تاريخ غير صالح." });
        }
        const dateString = formattedDate.toISOString().split("T")[0];
        dateCondition = `AND DATE(ci.CheckDate) = ?`;
        params.splice(params.length - 2, 0, dateString); // Insert date before pageSize and offset
      }

      // Main data query with INNER JOIN for CheckIn and isActive filter
      const data = await prisma.$queryRawUnsafe(
        `
        SELECT 
          hw.id,
          h.Name AS Name,
          hw.employee,
          hw.houseentrydate,
          hw.isActive,
          CAST(IFNULL(SUM(ci.DailyCost), 0) AS DECIMAL(10,2)) AS totalDailyCost
        FROM housedworker hw
        INNER JOIN homemaid h ON hw.homeMaid_id = h.id
        LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId
        WHERE (h.Name LIKE ? OR ? = '') 
          AND hw.isActive = true
          ${dateCondition}
        GROUP BY hw.id, h.Name, hw.employee, hw.houseentrydate, hw.isActive
        ORDER BY hw.houseentrydate DESC
        LIMIT ? OFFSET ?;
        `,
        ...params
      );

      // Total count query with INNER JOIN for CheckIn and isActive filter
      const countParams = [searchPattern, search];
      if (checkDate) {
        const formattedDate = new Date(checkDate);
        if (!isNaN(formattedDate.getTime())) {
          const dateString = formattedDate.toISOString().split("T")[0];
          countParams.push(dateString);
        }
      }

      const countResult: any = await prisma.$queryRawUnsafe(
        `
        SELECT COUNT(DISTINCT hw.id) as count
        FROM housedworker hw
        INNER JOIN homemaid h ON hw.homeMaid_id = h.id
        LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId
        WHERE (h.Name LIKE ? OR ? = '') 
          AND hw.isActive = true
          ${dateCondition};
        `,
        ...countParams
      );

      const totalItems = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / pageSize);

      res.status(200).json({
        page,
        pageSize,
        totalPages,
        totalItems,
        data,
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
