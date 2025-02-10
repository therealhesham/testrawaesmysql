import { PrismaClient, Prisma } from "@prisma/client";
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
    externalOfficeStatus,
    ExperienceYears,
  } = req.body;

  try {
    const existingOrder = await prisma.neworder.findFirst({
      where: { HomeMaid: { id: HomemaidId } },
    });

    if (existingOrder) {
      return res.status(400).json({
        message: "العاملة محجوزة بالفعل",
      });
    }

    // Begin transaction to update homemaid and create related records
    const result = await prisma.neworder.create({
      data: {
        HomemaidIdCopy: HomemaidId,
        ExperienceYears,
        Nationality,
        bookingstatus: "اكمال الطلب",
        Passportnumber,
        // externalOfficeStatus,
        Name,
        ClientName,
        clientphonenumber,
        Religion,
        PhoneNumber: "0",
        ages: age + "",

        client: {
          create: {
            email,
            fullname: ClientName, // Ensure the name field in the schema is 'fullname'
            phonenumber: clientphonenumber, // Ensure the phonenumber field in the schema matches
          },
        },
        HomeMaid: { connect: { id: HomemaidId } },
      },
    });

    await prisma.arrivallist.create({
      data: {
        // OrderId: result.id,
        SponsorName: ClientName,
        // HomemaidName:result.ho,
        PassportNumber: Passportnumber,
        Order: { connect: { id: result?.id } },
      },
    });

    // console.log(result);
    // Send response after the transaction is successful
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in creating new order:", error);

    // Custom error handling based on error type
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma known errors, such as unique constraint violations or foreign key issues
      if (error.code === "P2002") {
        return res.status(400).json({
          message: "البيانات التي تحاول ادخالها قد تكون مسجلة بالفعل",
          details: error.meta,
        });
      } else if (error.code === "P2003") {
        return res.status(400).json({
          message:
            "Foreign key constraint violation. Please check related data.",
          details: error.meta,
        });
      }
      return res.status(500).json({
        message: "خطأ في الاتصال بقاعدة البيانات",
        details: error.message,
      });
    }

    // Prisma validation errors (data type issues, etc.)
    if (error instanceof Prisma.PrismaClientValidationError) {
      return res.status(400).json({
        message: "عدم تطابق للبيانات",
        details: error.message,
      });
    }

    // Handle other unexpected errors
    res.status(500).json({
      message: "An unexpected error occurred.",
      details: error.message,
    });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client properly to avoid memory leak
  }
}
