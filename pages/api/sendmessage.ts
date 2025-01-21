//@ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken";
const prisma = new PrismaClient()


export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {

const prisma = new PrismaClient()


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
console.log("details","details")
const getdetails = jwt.verify(details,"secret")


const sign = await prisma.tasks.create({data:{receiver:req.body.receiver,fullmessage:req.body.fullmessage,sender:getdetails.name,title:req.body.title}}) 
res.status(200).json(sign)

} catch (error) {
  // res.status(301).send("createAdmin")
res.status(301).json("خطأ في تسجيل الدخول , تأكد من صحة البيانات");
// res.send("error")  
}

}


