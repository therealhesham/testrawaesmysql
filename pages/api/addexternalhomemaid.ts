import Airtable, { Table } from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  function getDate(date) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }
  console.log(req.body);
  try {
    const newexternal = await prisma.homemaid.create({
      data: {
        Nationalitycopy: req.body.Nationalitycopy,
        Name: req.body.Name,
        Religion: req.body.Religion,
        Passportnumber: req.body.Passportnumber,
        ExperienceYears: req.body.ExperienceYears,
        maritalstatus: req.body.maritalstatus,
        Experience: req.body.Experience,
        // dateofbirth: req.body.dateofbirth.replace("-", "/"),
        PassportStart: req.body.PassportStart,
        PassportEnd: req.body.PassportEnd,
        NewOrder: { create: { clientphonenumber: "00000" } },
      },
      include: { NewOrder: true },

      // phonenumber: req.body.phonenumber,
    });

    const newHoused = await prisma.housedworker.create({
      data: {
        houseentrydate: req.body.houseentrydate
          ? new Date(req.body.houseentrydate).toISOString()
          : null,
        deliveryDate: req.body.deliveryDate
          ? new Date(req.body.deliveryDate).toISOString()
          : null,
        Reason: req.body.reason,
        Details: req.body.details,
        employee: req.body.employee,
        order_id: newexternal.NewOrder[0].id,
      },
    });
    res.status(200).json(newHoused);
  } catch (error) {
    console.log(error);
    res.status(301).json("error");
  }
}

// export base;
