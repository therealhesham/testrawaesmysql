import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // if (req.method == "get") {
  //   try {
  //     const incomes = await prisma.income.findMany({
  //       where: { order_id: req.body.order_id },
  //     });
  //     return res.status(200).json(incomes);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

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
    const newinvoice = await prisma.income.create({
      data: {
        order_id: Number(req.body.order_id),
        amount: req.body.amount,
        Details: req.body.details,
        transaction_date: new Date(req.body.date).toISOString(),
      },
    });

    res.status(200).json(newinvoice);
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
