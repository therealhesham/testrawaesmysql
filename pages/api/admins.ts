//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient()
export default async function handler(req: NextApiRequest,res: NextApiResponse) {


 const result =  await prisma.user.findMany()
 console.log(result)
  res.status(200).json(result)
}

  // export base;