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
      where: { id: Number(req.body.id) },
      data: {
        bookingstatus: "rejected",
        ReasonOfRejection: req.body.ReasonOfRejection,
        HomeMaid: { disconnect: true },
      },
    });
    eventBus.emit('ACTION', {
        type: 'رفض طلب ' + updated.id,
        userId: Number(token.id),
      });   

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
