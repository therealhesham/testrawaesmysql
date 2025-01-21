//@ts-ignore
//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { PrismaClient } from "@prisma/client";
import Airtable ,{Table} from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
// import jwt from "jwt-decode";
import jwt from "jsonwebtoken"
import type { NextApiRequest, NextApiResponse } from 'next'
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');
type Data = {
  name: string
}
// PrismaClient
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
try {
try{
const prisma = new PrismaClient()

  const token = req.cookies.token


const decoder = jwt.verify(token,"secret")
const finder = await prisma.user.findFirst({where:{idnumber:decoder?.idnumber}})
if(finder.role != "adminstrator"  ) return   res.status(301).json("error");

} catch (error) {
  console.log(error)
  res.status(301).json("error")
  
}
  const promising = await new Promise(resolve=>{

const create= base('مصدر العميل').select({
    view: "Grid view"
}).eachPage(function page(records, fetchNextPage) {

  resolve(records)
})

  })
res.status(200).json(promising);
  
} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;