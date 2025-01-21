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
try {
    const {  clientname,
clientnameinenglishlanguage ,
    internalmusanedContract,
nationalidnumber,
contacntnumber,
passportnumber,
kingdomentrydate,
daydate,
workduration,
cost,
homemaidnumber,
notes,
homemaidname

}=req.body;
const obj = {
 "اسم الكفيل": "تركيه خليل ابراهيم الحزيمي",
      "\"هوية الكفيل  The identity of the sponsor\"": 1042214955,
      "\"جوال الكفيل  The sponsor's mobile\"": "532422484",
      "\"اسم العاملة  The name of the worker\"": "BEGUM SUMI",
      "\"رقم الجواز  Passport number\"": "A07323151",
      "جنسية العاملة": "بنجلاديش",
      "\"تارخ تقديم الطلب  The date of application\"": "2023-01-11",
      "الفترة الزمنية": "2023-04-11",
      "\"موافقة المكتب الخارجي  External office approval\"": "2023-05-13",
      "\"تاريخ الربط مع المكتب الخارجي  Date of connection with the external office\"": "2023-05-13",
      "\"تاريخ عمل الوكالة  Agency work history\"": "2023-05-27",
      "\"تاريخ التختيم في السفارة   The date stamped at the embassy\"": "2008-06-20",
      "\"تاريخ الحجز  booking date\"": "2023-04-06",
      "\"تاريخ الوصول  date of arrival\"": "2023-06-11",
      "رقم الحدود": 0,
      "المبلغ  للمكتب الخارجي": "تم",
      "الكشف الطبي": "NOT FIT",
      "\"مدينة الوصول  arrival city\"": " المدينة المنورة",
      "حالة الطلب": "تم الوصول ",
      "التفويض": "no"}
const result =  await new Promise((resolve,reject)=>{
  console.log(req.body)
const create = base('قائمة وصول الخادمات').create([
  {
    "fields": req.body
    
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














