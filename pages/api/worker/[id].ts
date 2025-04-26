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
      SELECT id, CheckDate, DailyCost      FROM CheckIn
      WHERE housedWorkerId = ${Number(id)}
      ORDER BY id DESC
    `;

    res.status(200).json(checkIns);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
