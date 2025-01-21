//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient()
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
try {

 const result =  await prisma.tasks.update({where:{id:req.body.id},data:{read:true}})
//  console.log(result)
  res.status(200).json(result);  
} catch (error) {
  console.log(error);
}

}

  // export base;