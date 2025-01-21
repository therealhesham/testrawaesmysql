//@ts-ignore
//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { PrismaClient } from "@prisma/client";
import Airtable, { Table } from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  return prisma.$transaction(async () => {
    const createrclient = await prisma.client.create({
      data: {
        fullname: req.body.ClientName,
        phonenumber: req.body.phoneNumber,
      },
    });
    if (createrclient == null) {
      throw new Error(`خطأ في تسجيل البيانات`);
    }
    console.log(req.body);
    const neworder = await prisma.neworder.create({
      data: {
        clientID: createrclient.id,
        ClientName: req.body.ClientName,
        PhoneNumber: req.body.PhoneNumber,
        HomemaidId: req.body.HomemaidId,
        age: req.body.age,
        bookingstatus: "حجز جديد",
        clientphonenumber: req.body.PhoneNumber,
        Name: req.body.Name,
        Passportnumber: req.body.Passportnumber,
        maritalstatus: req.body.maritalstatus,
        Nationalitycopy: req.body.Nationality[0],
        Religion: req.body.Religion,
        ExperienceYears: req.body.ExperienceYears,
      },
    });
    res.status(200).json(neworder);

    // return neworder;
  });
  // setTimeout(() => {

  // }, timeout);
  // sendSuggestion()
  //@ts-ignore
}

// export base;
