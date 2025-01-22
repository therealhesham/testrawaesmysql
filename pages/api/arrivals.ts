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
    const offices = await prisma.arrivallist.findMany();
    // console.log(offices);
    res.status(200).json(offices);
  } catch (error) {
    res.status(301).json("error");
  }
}

// export base;
