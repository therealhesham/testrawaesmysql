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
    
    const orderId = Number(req.body.id);
    if (!orderId || Number.isNaN(orderId)) {
      res.status(400).json({ error: 'معرف الطلب مطلوب (id)' });
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
      where: { id: orderId },include:{cancelledOrders:{include:{Client:{select:{fullname:true}}}}},
      data: {
        bookingstatus: "cancelled",
        ReasonOfCancellation: req.body.ReasonOfCancellation ?? 'تم الالغاء ',
        HomeMaid: { disconnect: true },
        cancelledOrders: {
          create: {
            ReasonOfCancellation: req.body.ReasonOfCancellation ?? 'تم الالغاء ',
            ...(orderHomemaidId != null && { HomeMaidId: orderHomemaidId }),
            ...(orderClientId != null && { clientId: orderClientId }),
          },
        },
      },
    });


    try {
      await prisma.logs.create({
        data: {
          Details: 'الغاء طلب العميل ' + orderClientName + "للعاملة " + updated.cancelledOrders[0].Client?.fullname,
          ...(orderHomemaidId != null && { homemaidId: orderHomemaidId }),
          userId: String(token?.username),
          Status: "الغاء طلب",
        },
      });
    } catch (error) {
      console.error("Error updating booking:", error);
    }
    try {
await prisma.systemUserLogs.create({
  data: { 
    // Details: 'رفض طلب ' + updated.id,
    // homemaidId : Number(req.body.HomeMaidId),
    userId: Number(token?.id),
    actionType: "الغاء طلب",
    action: "الغاء طلب",
    details: "الغاء طلب العميل " + orderClientName + "للعاملة " + updated.cancelledOrders[0].Client?.fullname,
    beneficiary: "Order",
    ...(orderClientId != null && { BeneficiaryId: orderClientId }),
    pageRoute: "/admin/track_order/"+updated.id,
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
