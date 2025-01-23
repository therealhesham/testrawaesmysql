//@ts-nocheck
//@ts-ignore
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
  console.log(req.body);
  try {
    const newoffice = await prisma.neworder.update({
      where: { id: Number(req.body.id) },
      data: { bookingstatus: req.body.bookingstatus },
    });

    res.status(200).json(newoffice);
  } catch (error) {
    // console.log(error);
    console.log(error);
    res.status(301).json("error");
  }
}

// export base;
