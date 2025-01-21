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
const prisma =new PrismaClient()
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
try{
  //@ts-ignore
const arr =[];
  // const result =  await new Promise((resolve,reject)=>{
const update = base('السير الذاتية').select({
    // Selecting the first 3 records in الاساسي:
    view: "الاساسي"
    }).all().then(e=>
      {
        //@ts-ignore
        for (let index = 0; index < e.length; index++) {
          if(e[index].get("phone") == req.body.phone)   arr.push(e[index]);   
          }
          if(arr.length == 0) return res.status(201).json("Not Found") ;
        //@ts-ignore
          res.status(200).json(arr)  
          
          }
          
          //@ts-ignore
);



// })

//@ts-ignore

} catch (error) {
  console.log(error)
  res.status(302).json({error:"connectivity error"})  

}

}

  // export base;