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
  console.log(req.body);
  try {
    const updated = await prisma.neworder.update({
      where: { id: Number(req.body.id) },
      data: { bookingstatus: req.body.bookingstatus },
    });
    console.log(updated.bookingstatus);
    res.status(200).json(updated.bookingstatus);
  } catch (error) {
    console.log(error);
    res.status(301).json("error");
  }
}

// export base;
