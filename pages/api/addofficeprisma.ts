// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// import { PrismaClient } from "@prisma/client";
import Airtable, { Table } from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.body);
  try {
    const newoffice = await prisma.offices.create({
      data: {
        Country: req.body.country,
        office: req.body.name,
        // phonenumber: req.body.phonenumber,
      },
    });
    res.status(200).json(newoffice);
  } catch (error) {
    res.status(301).json("error");
  }
}

// export base;
