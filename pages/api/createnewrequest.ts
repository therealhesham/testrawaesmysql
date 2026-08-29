import { Prisma } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
import { sendOrderNotifications } from "../../lib/notificationsHelper";



export default async function handler(req,res){


if (req.method === "GET") {
  try {
    const incomes = await prisma.income.findMany({
      where: { order_id: req.body.order_id },
    });
    return res.status(200).json(incomes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch incomes" });
  }
} else if (req.method === "POST") {
  const {
    ClientName,
    ClientPhone,
    ClientEmail,
    ClientCity,
    ExperienceYears,
    WorkerNationality,
    Religion,
    Age,
    Notes
  } = req.body;

  try {
    const newOrder = await prisma.neworder.create({
      data: {
        client: {
          create: {
            fullname: ClientName,
            phonenumber: ClientPhone,
            email: ClientEmail,
            city: ClientCity,
          },
        },
        ExperienceYears: ExperienceYears,
        clientphonenumber: ClientPhone,
      },
    });
    
    // إرسال الإشعارات
    try {
      sendOrderNotifications(
        newOrder.id,
        ClientName || "عميل خارجي",
        "",
        (res.socket as any)?.server?.io
      ).catch((e: any) => console.error("Error in background notifications", e));
    } catch (notifError) {
      console.error("Error importing/sending notifications", notifError);
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to create order" });
  }
}}