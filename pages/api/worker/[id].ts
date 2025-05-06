import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const checkIns = await prisma.$queryRaw`
      SELECT 
        c.id, 
        c.CheckDate, 
        c.DailyCost,
        h.Name AS workername
      FROM CheckIn c
      INNER JOIN housedworker hw ON c.housedWorkerId = hw.id
      INNER JOIN homemaid h ON hw.homeMaid_id = h.id
      WHERE c.housedWorkerId = ${Number(id)}
      ORDER BY c.id DESC
    `;

    res.status(200).json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}