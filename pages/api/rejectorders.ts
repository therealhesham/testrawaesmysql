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
  console.log(req.query);
  console.log(req.query.pid);
  const count = await prisma.neworder.count();
  const find = await prisma.neworder.findMany({
    where: { bookingstatus: "طلب مرفوض" },
  });
  // sendSuggestion()
  //@ts-ignore
  // console.log(arr)
  //@ts-ignore
  res.status(200).json({ data: find });
}

// export base;
