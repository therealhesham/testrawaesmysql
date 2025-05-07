import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Fetch data with the filters and pagination
    const homemaids = await prisma.arrivallist.findFirst({
      include: { Order: { include: { HomeMaid: true } } },
      where: { Order: { HomeMaid: { id: req.body.homeMaid } } },
    });

    if (!homemaids) {
      const result = await prisma.neworder.create({
        data: {
          isHidden: true,
          // : req.body.homeMaid,
          HomemaidIdCopy: req.body.homeMaid,
//           arrivals: {
//             create: {
//               DeparatureFromSaudiDate: req.body.deparatureFromSaudi,
//               HomemaIdnumber: req.body.homeMaid, // Replace with the actual unique field for 'arrivallist'
// WorkDuration: req.body.workDuration||"sss",
// Cost: req.body.cost||"sss",
// ArrivalCity: req.body.arrivalCity,
//               DeparatureFromSaudiCity: req.body.deparatureCity,

//               deparatureTime: req.body.departureTime,
//             },
          // },
          
          HomeMaid: { connect: { id: req.body.homeMaid } },
          clientphonenumber: "sss", // Ensure this field is provided in the request body
        },
      });

      await prisma.housedworker.update({
        where: { homeMaid_id: req.body.homeMaid },
        data: {
          isActive: false,
          deparatureReason: "سافرت",
          deparatureHousingDate: req.body.departureDate,
        },
      });

      // await prisma.arrivallist.create({
      //   data: {
      //     // OrderId: result.id,
      //     // SponsorName: ClientName,
      //     // HomemaidName:result.ho,
      //     PassportNumber: Passportnumber,
      //     Order: { connect: { id: result?.id } },
      //   },
      // });
      console.log(result);
      res.status(201).json(result);
    } else {
      const result = await prisma.neworder.update({
        include: {
          arrivals: { select: { deparatureDate: true, deparatureTime: true } },
        },
        where: { id: homemaids.Order?.id },
        data: {
          HomemaidIdCopy: req.body.homeMaid,
          arrivals: {
            update: {
              where: { id: homemaids.id },
              data: {
                DeparatureFromSaudiTime: req.body.departureTime,

                DeparatureFromSaudiDate: req.body.deparatureFromSaudi,
              },
            },
          },

          clientphonenumber: "00000m", // Ensure this field is provided in the request body
        },
      });

      await prisma.housedworker.update({
        where: { homeMaid_id: req.body.homeMaid },
        data: {
          isActive: false,
          deparatureReason: "سافرت",
          deparatureHousingDate: req.body.departureDate,
          checkIns: {
            updateMany: {
              where: { isActive: true }, // Add appropriate conditions here
              data: { isActive: false },
            },
          },
        },
      });

      console.log(result);
      res.status(201).json(result);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
