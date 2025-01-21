// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
//@ts-nocheck
//@ts-ignore
import { PrismaClient } from "@prisma/client";
import Airtable ,{Table} from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
import jwt from "jsonwebtoken"
import type { NextApiRequest, NextApiResponse } from 'next'
// var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.56e6d82c73f5ec39152c7212d8c8a0710856aeb10ba0e268a2bb06a5cf919b06'}).base('app1mph1VMncBBJid');
var base = new Airtable({apiKey: 'patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c'}).base('app1mph1VMncBBJid');


export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}
 
try {
  const {  clientname,
insurance,
    musanedContract,
visanumber,
idnumber,
mobilenumber,
passportnumber,
workername,
age,
experience,
contractstatus,
city,
orderDate,
dayDate,
duration,
job,
externaloffice,
nationality,
externalmusanedcontract
}=req.body;
// console.log(Number(mobilenumber))
const result =  await new Promise((resolve,reject)=>{

  const create = base('العقود الملغاة - جميع الجنسيات').create([
  {
    "fields": {
      // "Name": req.body.country
      "اســــم الـــعــمـــيـــل":clientname,
      "التأمين":insurance,
      "عقد مساند الداخلي":musanedContract,
      "رقم التأشيرة":visanumber,
      "رقم الهوية":idnumber,
      "رقم الجوال":mobilenumber,
      "رقم جواز العاملة":passportnumber,
      "أســـــم  الــعــــامــــل":workername,
      "العمر":age,
      "المهنة":experience,
      "حالة العقد":contractstatus,
"المدينة":city,
 "تاريخ تقديم الطلب":formatDate(orderDate),
      "تاريخ اليوم":dayDate,
      "مدة التقديم":duration,
      "المكتب الخارجي":externaloffice,
"الجنسية":nationality,
      "عقد مساند الخارجي":externalmusanedcontract ,   }
  }
])

   resolve(create)

 

   
  })

// console.log(result)
  res.status(200).json(result)  
} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;
















