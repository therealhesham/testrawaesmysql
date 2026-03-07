import '../../lib/loggers';


// pages/api/update-booking.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {


     const cookieHeader = req.headers.cookie;
        let cookies: { [key: string]: string } = {};
        if (cookieHeader) {
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
        }
        console.log(cookies.authToken)
        const token = jwtDecode(cookies.authToken);
    
    const orderId = Number(req.body.id ?? req.body.HomeMaidId);
    if (!orderId || Number.isNaN(orderId)) {
      res.status(400).json({ error: 'معرف الطلب مطلوب (id أو HomeMaidId)' });
      return;
    }

    const order = await prisma.neworder.findUnique({
      where: { id: orderId },
      select: { HomemaidId: true, clientID: true, ClientName: true },
    });
    if (!order) {
      res.status(404).json({ error: 'الطلب غير موجود' });
      return;
    }

    const orderHomemaidId = order.HomemaidId != null ? order.HomemaidId : undefined;
    const orderClientId = order.clientID != null ? order.clientID : undefined;
const orderClientName = order.ClientName != null ? order.ClientName : undefined;
    const updated = await prisma.neworder.update({
      where: { id: orderId },include:{rejectedOrders:{include:{Client:{select:{fullname:true}}}}},
      data: {
        bookingstatus: "rejected",
        ReasonOfRejection: req.body.ReasonOfRejection,
        HomemaidIdCopy: null,
        HomeMaid: { disconnect: true },
        rejectedOrders: {
          create: {
            ReasonOfRejection: req.body.ReasonOfRejection,
            ...(orderHomemaidId != null && { HomeMaidId: orderHomemaidId }),
            ...(orderClientId != null && { clientId: orderClientId }),
          },
        },
      },
    });


    try {
      await prisma.logs.create({
        data: {
          Details: 'رفض طلب العميل ' + orderClientName + "للعاملة " + updated.rejectedOrders[0].Client?.fullname,
          ...(orderHomemaidId != null && { homemaidId: orderHomemaidId }),
          userId: String(token?.username),
          Status: "رفض طلب",
        },
      });
    } catch (error) {
      console.error("Error updating booking:", error);
    }
    try {
await prisma.systemUserLogs.create({
  data: { 
    userId: Number(token?.id),
    actionType: "رفض طلب",
    action: "رفض طلب",
    details: "رفض طلب العميل " + orderClientName + "للعاملة " + updated.rejectedOrders[0].Client?.fullname,
    beneficiary: "Order",
    ...(orderClientId != null && { BeneficiaryId: orderClientId }),
    pageRoute: "/rejectbookingprisma",
  },
});

    } catch (error) {
      console.error("Error updating booking:", error);
    }
    // Respond with the updated booking status
    res.status(200).json(updated.bookingstatus);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Disconnect the Prisma client to release database connections
    await prisma.$disconnect();
  }
}
