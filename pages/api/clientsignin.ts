import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import jwt from "jsonwebtoken";
import Cookies from 'js-cookie';
const prisma = new PrismaClient()

export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {
try {
  // await prisma..
console.log(req.headers.cookie)


const createAdmin=await prisma.client.findFirst({where:{phonenumber:req.body.phonenumber}})
  console.log("email",createAdmin)
  if(createAdmin?.password != req.body.password) return res.status(301).send("خطأ في الرقم السري");
//@ts-ignore
const sign =jwt.sign(createAdmin,"secret");  

res.status(200).json(sign)

} catch (error) {
  console.log(error)
  // res.status(301).send("createAdmin")
res.status(301).json("خطأ في تسجيل الدخول , تأكد من صحة البيانات");
// res.send("error")  
}

}


