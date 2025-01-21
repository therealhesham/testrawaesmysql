//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.56e6d82c73f5ec39152c7212d8c8a0710856aeb10ba0e268a2bb06a5cf919b06'}).base('app1mph1VMncBBJid');
const prisma= new PrismaClient()
// var base = new Airtable({apiKey: 'patxcurNRUmoDr1fJ.38e74d9cb6cdbe1c4c46d457f3d9b4514cddb6af8fb09e0e3446ffb9da9dbdff'}).base('appkSvToN2W2ScgdW');
type Data = {
  name: string
}

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
 
  const result =  await new Promise((resolve,reject)=>{


    base('الدول').select({
      //  fields:{}
        // Selecting the first 3 records in Grid view:
        view: "الاساسي"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
    
        records.forEach(function(record,s) {
            // console.log(s)
            // console.log('Retrieved', record.get('Name'));
        });
    
 resolve(records)       
    }, function done(err) {
        if (err) { console.error(err); return; }
    });

 
})

  res.status(200).json(result)
}

  // export base;