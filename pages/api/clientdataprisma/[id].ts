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
  const find = await prisma.client.findFirst({
    where: { id: Number(req.query.id) },
  });
  // sendSuggestion()
  //@ts-ignore
  // console.log(arr)
  //@ts-ignore
  res.status(200).json(find);
}

// export base;
