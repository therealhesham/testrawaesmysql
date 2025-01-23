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

  const {
    ClientName,
    PhoneNumber,
    HomemaidId,
    age,
    clientphonenumber,
    Name,
    Passportnumber,
    maritalstatus,
    email,
    Nationality,
    Religion,
    ExperienceYears,
  } = req.body;

  try {
    // Begin transaction to update homemaid and create related records
    const result = await prisma.neworder.create({
      data: {
        ClientName,
        Religion,
        PhoneNumber: "0",
        ages: age + "",
        Client: {
          create: {
            email,
            fullname: ClientName, // Ensure the name field in the schema is 'fullname'
            phonenumber: clientphonenumber, // Ensure the phonenumber field in the schema matches
          },
        },
        HomeMaid: { connect: { id: HomemaidId } },
      },
    });

    // Send response after the transaction is successful
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in creating new order:", error);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client properly to avoid memory leak
  }
}
