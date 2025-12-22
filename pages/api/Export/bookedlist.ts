import '../../../lib/loggers';


import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";
import { jwtDecode } from "jwt-decode";
import eventBus from "lib/eventBus";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {


  
  try {
    const totalRecords = await prisma.neworder.count({
      where: {
        HomemaidId: { gt: 0 },
        NOT: {
          bookingstatus: {
            in: ["delivered", "rejected"],
          },
        },
      },
    });

    const booked = await prisma.neworder.findMany({
      where: {
        HomemaidId: { gt: 0 },
        NOT: {
          bookingstatus: {
            in: ["delivered", "rejected"],
          },
        },
      },
      orderBy: { id: "desc" },
      include: { HomeMaid: { include: { office: true } },client:true },
    });
try {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  const referer = req.headers.referer || '/admin/fulllist'
  const token = jwtDecode(cookies.authToken) as any;
  eventBus.emit('ACTION', {
    type: "تصدير قائمة الطلبات المحجوزة",
    beneficiary: "homemaid",
    pageRoute: referer,
    actionType: "view",
    userId: Number(token.id),
  });
} catch (error) {
  console.error("Error emitting event:", error);
}









    
    res.status(200).json({ data: booked});
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}