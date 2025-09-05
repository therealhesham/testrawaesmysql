import '../../lib/loggers'; // استدعاء loggers.ts في بداية التطبيق


import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

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

    address,
    nationalId,
    age,
    clientphonenumber,
    Name,
    Passportnumber,
    maritalstatus,
    email,
    Nationality,
    Religion,
    city,
    externalOfficeStatus,
    ExperienceYears,
  } = req.body;
  console.log(req.body);
  try {
    const existingOrder = await prisma.neworder.findFirst({
      where: { HomeMaid: { id: HomemaidId } },
    });

    if (existingOrder) {
      console.log(existingOrder)
      return res.status(400).json({
        message: "العاملة محجوزة بالفعل",
      });
    }

    // Begin transaction to update homemaid and create related records
    const result = await prisma.neworder.create({
      data: {
        HomemaidIdCopy: HomemaidId,
        ExperienceYears:ExperienceYears+"",
        Nationality,
        bookingstatus: "new_order",
        Passportnumber,
        // externalOfficeStatus,
        Name,
        ClientName,
        clientphonenumber,
        Religion,
        PhoneNumber: PhoneNumber,
        ages: age + "",
        housed: { create: { HomeMaidId: HomemaidId } },

        client: {
          create: {
            email,
            address,
            city,
            nationalId,
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

    eventBus.emit('ACTION', {
        type: 'تسجيل طلب جديد رقم  ' + result.id,
        userId: Number(token.id),
      });

    // console.log(result);
    // Send response after the transaction is successful
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in creating new order:", error);
      console.error("Validation error:", error);

    // Custom error handling based on error type
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma known errors, such as unique constraint violations or foreign key issues
      if (error.code === "P2002") {
      console.error("Validation error:", error);

        return res.status(400).json({
          message: "البيانات التي تحاول ادخالها قد تكون مسجلة بالفعل",
          details: error.meta,
        });
      } else if (error.code === "P2003") {
      console.error("Validation error:", error);

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
      console.error("Validation error:", error);
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
