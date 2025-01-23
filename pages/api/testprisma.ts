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
    const data = await prisma.neworder.findMany({
      take: 10,
      include: { HomeMaid: true },
    });
    res.status(301).json(data);

    console.log(data);
  } catch (error) {
    res.status(301).json(error);
  }
}

// export base;
