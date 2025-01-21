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
//   for (const [k , v] of Object.entries(JSON.parse(req.body))) {
// if(k=="id") return
//     console.log(k)

//   }
const obj =JSON.parse(req.body)
delete obj.id
console.log(obj) 
const {id}=JSON.parse(req.body)
console.log(JSON.parse(req.body))
const result =  await new Promise((resolve,reject)=>{
const create = base('قائمة وصول الخادمات').update([
  {
    "id": id,
    "fields": obj
  }])
// console.log(result)
  res.status(200).json(create)  
})


} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;