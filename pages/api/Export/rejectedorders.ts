import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    searchTerm,
    age,
    externalOfficeStatus,
    InternalmusanedContract,
    Passportnumber,
    clientphonenumber,
    Nationalitycopy,
    page,
    HomemaidId,
    Country,
  } = req.query;


  // Build the filter object dynamically based on query parameters
  const filters: any = {};

  try {
    // جلب الطلبات المرفوضة والملغية
    const orders = await prisma.neworder.findMany({
        orderBy: { id: "desc" },
        include: {
          client: true,
        },
        where: {
          bookingstatus: { in: ["rejected", "cancelled"] },
        },
      });

    // جلب بيانات العاملات من HomemaidIdCopy
    const homemaidIds = orders
      .filter(order => order.HomemaidIdCopy)
      .map(order => order.HomemaidIdCopy as number);

    const homemaidsData = await prisma.homemaid.findMany({
      where: {
        id: { in: homemaidIds },
      },
      select: {
        id: true,
        Name: true,
        Passportnumber: true,
        Nationalitycopy: true,
        Religion: true,
        age: true,
        dateofbirth: true,
        office: {
          select: {
            Country: true,
          },
        },
      },
    });

    // دمج البيانات
    const homemaids = orders.map(order => {
      const homemaid = homemaidsData.find(h => h.id === order.HomemaidIdCopy);
      return {
        ...order,
        HomeMaid: homemaid || null,
      };
    });

    res.status(200).json({ homemaids });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}