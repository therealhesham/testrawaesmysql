
//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { PrismaClient } from "@prisma/client";
import Airtable ,{Table} from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
// import jwt from "jwt-decode";
// import "../api/sendmessage"
import jwt from "jsonwebtoken"
import type { NextApiRequest, NextApiResponse } from 'next'
var base = new Airtable({apiKey: 'patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c'}).base('app1mph1VMncBBJid');


export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
try {
  const details = req.cookies.token
const getdetails = jwt.verify(details,"secret")

  const result =  await new Promise((resolve,reject)=>{
const update = base('السير الذاتية المحجوزة').update([
  {
    "id": req.body.id,
    "fields": {
      "اسم الموظف":getdetails.name,
      "رقم جوال الموظف":getdetails.phonenumber+"",
      "حالة الحجز":"ملغي"
    }}])

   resolve(update)

 







   
   
  })






  
// console.log(result)
  res.status(200).json(result)  
} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;