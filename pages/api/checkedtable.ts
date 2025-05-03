import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = (req.query.search as string)?.trim() || "";
    const offset = (page - 1) * pageSize;
    const searchPattern = `%${search}%`;

    // Main data query with INNER JOIN for CheckIn and isActive filter
    const data = await prisma.$queryRaw`
      SELECT 
        hw.id,
        h.Name AS Name,
        hw.employee,
        ci.CheckDate,
        hw.houseentrydate,
        hw.isActive,
        CAST(IFNULL(SUM(ci.DailyCost), 0) AS DECIMAL(10,2)) AS totalDailyCost
      FROM housedworker hw
      INNER JOIN homemaid h ON hw.homeMaid_id = h.id
      INNER JOIN CheckIn ci ON hw.id = ci.housedworkerId
      WHERE (h.Name LIKE ${searchPattern} OR ${search} = '') AND hw.isActive = true
      GROUP BY hw.id, h.Name, hw.employee, hw.houseentrydate, hw.isActive, ci.CheckDate
      ORDER BY hw.id DESC
      LIMIT ${pageSize} OFFSET ${offset};
    `;

    // Total count query with INNER JOIN for CheckIn and isActive filter
    const countResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT hw.id) as count
      FROM housedworker hw
      INNER JOIN homemaid h ON hw.homeMaid_id = h.id
      INNER JOIN CheckIn ci ON hw.id = ci.housedworkerId
      WHERE (h.Name LIKE ${searchPattern} OR ${search} = '') AND hw.isActive = true;
    `;

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / pageSize);

    res.status(200).json({
      page,
      pageSize,
      totalPages,
      totalItems,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}