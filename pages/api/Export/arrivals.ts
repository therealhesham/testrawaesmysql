import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {
    const homemaids = await prisma.arrivallist.findMany({
      where: {
        KingdomentryDate: { not: null },
      },
      select: {
        Order: {
          select: {client:{select:{fullname:true}},
            Name: true,
            ClientName: true,
            HomeMaid: {
              select: { Name: true, Passportnumber: true, id: true, office: true, age: true },
            },
            clientphonenumber: true,
            id: true,
          },
        },
        OrderId: true,
        SponsorName: true,
        PassportNumber: true,
        KingdomentryDate: true,
        KingdomentryTime: true,
        arrivalSaudiAirport: true,
        deparatureCityCountry: true,
        deparatureCityCountryDate: true,
        deparatureCityCountryTime: true,
        medicalCheckFile: true,
        ticketFile: true,
        SponsorPhoneNumber: true,
        SponsorIdnumber: true,
        InternalmusanedContract: true,
        HomemaIdnumber: true,
        HomemaidName: true,
        Notes: true,
        id: true,
      },
    });

    const now = new Date();
    
    // تصنيف الرحلات إلى: لم تصل (في المستقبل) و وصلت (في الماضي أو الحاضر)
    const notArrived = homemaids.filter(item => item.KingdomentryDate && new Date(item.KingdomentryDate) > now);
    const arrived = homemaids.filter(item => !item.KingdomentryDate || new Date(item.KingdomentryDate) <= now);

    // ترتيب التي لم تصل: من الأقرب تاريخاً إلى الأبعد (تصاعدي)
    notArrived.sort((a, b) => {
      const dateA = new Date(a.KingdomentryDate!).getTime();
      const dateB = new Date(b.KingdomentryDate!).getTime();
      return dateA - dateB;
    });

    // ترتيب التي وصلت: من الأحدث وصولاً إلى الأقدم (تنازلي)
    arrived.sort((a, b) => {
      const dateA = a.KingdomentryDate ? new Date(a.KingdomentryDate).getTime() : 0;
      const dateB = b.KingdomentryDate ? new Date(b.KingdomentryDate).getTime() : 0;
      return dateB - dateA;
    });

    const sortedAll = [...notArrived, ...arrived];

    res.status(200).json({
      data: sortedAll,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}