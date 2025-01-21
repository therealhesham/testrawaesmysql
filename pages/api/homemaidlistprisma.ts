// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable, { Table } from "airtable";
import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // sendSuggestion()
  const find = await prisma.homemaid.findMany({});
  res.status(200).json(find);
}
