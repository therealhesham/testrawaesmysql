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
var base = new Airtable({apiKey: 'patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c'}).base('app1mph1VMncBBJid');
var baseFinder = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

type Data = {
  name: string
}
// PrismaClient
const prisma =new PrismaClient()
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
try{

  const token = req.cookies.token


const decoder = jwt.verify(token,"secret")
const finder = await prisma.user.findFirst({where:{idnumber:decoder?.idnumber}})
if(finder.role != "adminstrator"  ) return   res.status(301).json("error");

} catch (error) {
  console.log(error)
  res.status(301).json("error")
  
}

try {
const details = req.cookies.token
const getdetails = jwt.verify(details,"secret")




  // console.log(req.body)
const finder = await prisma.client.findFirst({where:{phonenumber:req.body.phonenumber}})


if(finder?.phonenumber == req.body.phonenumber) return res.status(301).json({error:"رقم الجوال مسجل لدينا في قاعدة البيانات"});
try {
  //@ts-ignore
  if(req.body.password.length < 8) return res.status(301).json({error:"خطأ في الرقم السري"});
  
} catch (error) {
  return res.status(301).json({error:"خطأ في الرقم السري"});
}

const newclient = await prisma.client.create({data:{isUser:true,fullname:req.body.fullname,password:req.body.password,
    phonenumber:req.body.phonenumber
  }})

// await prisma.timeline.create({data:{fulltext:""}})
  
  const resultone =  await new Promise((resolve,reject)=>{
const create = base('العملاء').create([
  {
    "fields": {
      "رقم العميل": Number(req.body.phonenumber),
      "اسم العميل": req.body.fullname
  
    }
  }])
 resolve(create)

   
  })

  const result =  await new Promise((resolve,reject)=>{



    const update = base('السير الذاتية').update([
  {
    "id": req.body.id,
    "fields": {
      "phone":req.body.phonenumber,
      "حالة الحجز":"حجز جديد"
    }}])

   resolve(update)

 

   
  })


const resultbookedcv =  await new Promise((resolve,reject)=>{

  

const resultbooked=base('السير الذاتية المحجوزة').create([
  {
    "fields": {"اسم العميل":req.body.fullname,
 "اسم الموظف":getdetails.name,
"رقم جوال العميل":req.body.phonenumber,
"رقم السيفي":req.body.cvnumber,
"اسم العاملة":req.body.workername,
"حالة الحجز":"محتمل"
// "اسم الموظف":"حجز من الموقع"


    }
  }
]);
resolve(resultbooked)
   
  })


  res.status(200).json(result)  
} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;