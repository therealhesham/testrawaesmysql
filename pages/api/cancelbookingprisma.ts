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
    
    const updated = await prisma.neworder.update({
      where: { id: Number(req.body.HomeMaidId) },
      data: {

        bookingstatus: "cancelled",
        ReasonOfCancellation: req.body.ReasonOfCancellation,
        HomeMaid: { disconnect: true },
        cancelledOrders: {
          create: {
            ReasonOfCancellation: req.body.ReasonOfCancellation,
            HomeMaidId: Number(req.body.HomeMaidId),
            clientId: Number(req.body.clientID),
          },
        },
      },
    });


    try {
      await prisma.logs.create({
        data: {
          Details: 'الغاء طلب ' + updated.id,
          homemaidId: Number(req.body.HomeMaidId),
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
    userId: Number(token.id),
    actionType: "الغاء طلب",
    action: "الغاء طلب",
    beneficiary: "Order",
    BeneficiaryId: Number(req.body.clientID),
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
