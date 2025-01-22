import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient(); // Instantiate PrismaClient outside the handler to improve performance.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      ClientName,
      PhoneNumber,
      HomemaidId,
      age,
      clientphonenumber,
      Name,
      Passportnumber,
      maritalstatus,
      Nationality,
      Religion,
      ExperienceYears,
    } = req.body;
    console.log(req.body);
    // Begin transaction
    const result = await prisma.$transaction(
      async (prisma) => {
        const createClient = await prisma.client.create({
          data: {
            fullname: ClientName,
            phonenumber: clientphonenumber,
          },
        });

        if (!createClient) {
          throw new Error("خطأ في تسجيل البيانات");
        }

        const newOrder = await prisma.neworder.create({
          data: {
            clientID: createClient.id,
            ClientName,
            PhoneNumber, // تليفون الخدامة
            HomemaidId,
            age,
            bookingstatus: "حجز جديد",
            clientphonenumber,
            Name,
            Passportnumber,
            maritalstatus,
            Nationalitycopy: Nationality[0],
            Religion,
            ExperienceYears,
          },
        });

        return newOrder;
      },
      { maxWait: 15 }
    );

    // Send response after the transaction is successful
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in creating new order:", error);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client properly to avoid memory leak
  }
}
