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
    PaymentMethod,
    Name,
    typeOfContract,
    Passportnumber,
    maritalstatus,
    email,
    orderDocument,
    contract,
    Nationality,
    Religion,
    city,
    externalOfficeStatus,
    ExperienceYears,
    Paid
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
    const result = await prisma.neworder.create({include:{client:true},
      data: {
        HomemaidIdCopy: HomemaidId,
        ExperienceYears:ExperienceYears+"",
        Nationality,
        bookingstatus: "new_order",
        Passportnumber,
        PaymentMethod,
        // externalOfficeStatus,
        typeOfContract,
        Name,
        ClientName,
        clientphonenumber,
        Religion,
        PhoneNumber: PhoneNumber,
        ages: age + "",
        housed: { create: { HomeMaidId: HomemaidId } },
        // @ts-ignore
        paid: Paid == null ? undefined : Number(Paid),

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
    const token = jwtDecode(cookies.authToken) as any;

    eventBus.emit('ACTION', {
        type: 'تسجيل طلب جديد رقم  ' + result.id,
        userId: Number(token.id),
      });

      try {
        await prisma.logs.create({data:{Status: 'تسجيل طلب جديد رقم  ' + result.id,homemaidId: HomemaidId,userId: token.id}})
      } catch (error) {
        console.log(error)
      }
    // console.log(result);
    // Send response after the transaction is successful
    res.status(200).json(result);

    const homemaid = await prisma.homemaid.findUnique({
      where: { id: HomemaidId },
      include: { office: true }
    });

    const officeName = homemaid?.officeName || homemaid?.office?.office || '';

    const statement = await prisma.clientAccountStatement.create({
      data: {
        clientId: Number(result.client.id), // assuming clientID is set in neworder
        orderId: Number(result.id),
        contractNumber: `ORD-${result.id}`,
        officeName,
        totalRevenue: Number(Paid),
        totalExpenses: 0,
        netAmount: Number(Paid),
        contractStatus: 'new',
        notes: ''
      }
    });

    await prisma.clientAccountEntry.create({
      data: {
        statementId: statement.id,
        date: new Date(),
        description: 'دفعة أولى',
        debit: 0,
        credit: Number(Paid),
        balance: Number(Paid),
        entryType: 'payment'
      }
    });

  } catch (error: unknown) {
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
        details: (error as Error).message,
      });
    }

    // Prisma validation errors (data type issues, etc.)
    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("Validation error:", error);
      return res.status(400).json({
        message: "عدم تطابق للبيانات",
        details: (error as Error).message,
      });
    }

    // Handle other unexpected errors
    res.status(500).json({

      message: "An unexpected error occurred.",
      details: (error as Error).message,
    });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client properly to avoid memory leak
  }
}
