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
        internaldeparatureDate: { not: null },
      },
      select: {
        Order: {
          select: {
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
        internaldeparatureDate: true,
        internaldeparatureTime: true,
        internaldeparatureCity: true,
        internalArrivalCity: true,
        internalArrivalCityDate: true,
        internalArrivalCityTime: true,
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
      orderBy: { id: "desc" },
    });
console.log("homemiad", homemaids);
    res.status(200).json({
      data: homemaids,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}