import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const housedWorkers = await prisma.housedworker.findMany({
      include: {
        checkIns: {
          select: {
            DailyCost: true,
          },
        },
      },
    });

    const result = housedWorkers.map((worker) => ({
      id: worker.id,
      employee: worker.employee,
      houseentrydate: worker.houseentrydate,
      isActive: worker.isActive,
      totalDailyCost: worker.checkIns.reduce(
        (sum, checkIn) => sum + (checkIn.DailyCost || 0),
        0
      ),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
