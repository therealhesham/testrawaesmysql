// pages/api/clients/export.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fullname, email, phonenumber } = req.query;

    const filters: any = {};
    if (fullname) filters.fullname = { contains: fullname as string };
    if (email) filters.email = { contains: email as string };
    if (phonenumber) filters.phonenumber = { contains: phonenumber as string };

    const clients = await prisma.client.findMany({
      orderBy: { id: "desc" },
      where: { ...filters },
      select: {
        id: true,
        fullname: true,
        email: true,
        phonenumber: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          orderBy: { id: "desc" },
          include: { HomeMaid: true },
        },
      },
    });

    res.status(200).json({ data: clients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ في جلب البيانات" });
  } finally {
    await prisma.$disconnect();
  }
}
