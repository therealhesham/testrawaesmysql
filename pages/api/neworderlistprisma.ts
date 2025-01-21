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
  console.log("page", req.query.pid);
  const find = await prisma.neworder.findMany();
  const count = await prisma.neworder.count();
  // sendSuggestion()
  //@ts-ignore
  // console.log(arr)
  //@ts-ignore
  res.status(200).json({ data: find, count });
}

// export base;
