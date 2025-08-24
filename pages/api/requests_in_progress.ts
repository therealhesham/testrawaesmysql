import { PrismaClient, Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      type,
      search = "",
      status = "",
      office = "",
      page = "1",
      limit = "10",
      count = "false",
    } = req.query;

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const perPage = Math.max(parseInt(limit as string, 10) || 10, 1);

    const whereClause: Prisma.NeworderWhereInput = {
      typeOfContract: type as string,
      isHidden: false,
    };

    if (search) {
      whereClause.OR = [
        { ClientName: { contains: search as string, mode: "insensitive" } },
        { Name: { contains: search as string, mode: "insensitive" } },
      ];
    }

    if (status) {
      whereClause.profileStatus = status as string;
    }

    if (office) {
      whereClause.officeName = office as string;
    }

    if (count === "true") {
      const total = await prisma.neworder.count({ where: whereClause });
      return res.json({ count: total });
    }

    const [orders, total] = await Promise.all([
      prisma.neworder.findMany({
        where: whereClause,
        include: {arrivals:true,
          client: true,
          HomeMaid: {
            select: {
              id: true,
              Name: true,
              office: { select: { Country: true, office: true } },
            },
          },
        },
        skip: (pageNum - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: "desc" },
      }),
      prisma.neworder.count({ where: whereClause }),
    ]);

    res.json({
      orders,
      total,
      page: pageNum,
      limit: perPage,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  } finally {
    await prisma.$disconnect();
  }
}