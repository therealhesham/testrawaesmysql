//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest,res: NextApiResponse) {


 const result =  await prisma.officemssages.count();
 const inboxCounter=  await prisma.officemssages.count({where:{type:"inbox"}});
 const sentCounter =   await prisma.officemssages.count({where:{type:"sent"}});
  res.status(200).json({result,inboxCounter,sentCounter})
}

  // export base;