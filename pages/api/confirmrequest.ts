import '../../lib/loggers';


import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id, SponsorName, PassportNumber, HomemaidName, KingdomentryDate } =
      req.body;
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

    if (!id) {
      return res.status(400).json({ error: "Order ID is required." });
    }
    const waiter = await prisma.neworder.update({
      where: { id },
      data: { bookingstatus: "pending_external_office" },
    });
    await prisma.arrivallist.create({
      data: {
        // OrderId:id,
        SponsorName,
        HomemaidName,
        PassportNumber,


        Order: { connect: { id } },
      },
    });
    // eventBus.emit('ACTION', {
    //     type: 'تأكيد طلب ' + waiter.id,
    //     userId: Number(token.id),
    //   });   
    // Return the updated order with the newly created arrival
    res.status(200).json(waiter);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}
