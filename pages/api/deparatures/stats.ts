import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const internalCount = await prisma.arrivallist.count({
      where: { internaldeparatureDate: { not: null } },
    });
    const externalCount = await prisma.arrivallist.count({
      where: { externaldeparatureDate: { not: null } },
    });
    res.status(200).json({ internalCount, externalCount });
  } catch (error) {
    console.error("Error in stats:", error);
    res.status(500).json({ internalCount: 0, externalCount: 0 });
  } finally {
    await prisma.$disconnect();
  }
}
