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
    // Read page and pageSize from query string, with defaults
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const data = await prisma.$queryRaw`
      SELECT 
        hw.id,
        h.Name AS Name,
        hw.employee,
        hw.houseentrydate,
        hw.isActive,
        IFNULL(SUM(ci.DailyCost), 0) AS totalDailyCost
      FROM housedworker hw

      LEFT JOIN \`homemaid\` h ON hw.homeMaid_id = h.id
      LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId
      GROUP BY hw.id, h.Name, hw.employee, hw.houseentrydate, hw.isActive
        order by hw.id desc

      LIMIT ${pageSize} OFFSET ${offset};
    `;

    // Total count (needed to calculate total pages)
    const countResult: any = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT hw.id
        FROM housedworker hw
        LEFT JOIN \`homemaid\` h ON hw.homeMaid_id = h.id
        LEFT JOIN CheckIn ci ON hw.id = ci.housedworkerId
        GROUP BY hw.id
        
      ) as grouped;
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
