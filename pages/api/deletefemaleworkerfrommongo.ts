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
 const token = req.cookies.token


const decoder = jwt.decode(token)
const finder = await prisma.user.findFirst({where:{idnumber:decoder.idnumber}})
if(finder.role != "adminstrator"  ) return   res.status(301).json("error");


 
 
  const result =  await prisma.femalWorker.delete({where:{id:req.body.id}})
  res.status(200).json(result)
} catch (error) {
  console.log(error)
  res.status(301).json("error")
  
}


}

  // export base;