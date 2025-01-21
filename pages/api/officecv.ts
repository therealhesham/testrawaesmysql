//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

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
let arr = []
console.log(req.query)
const result =  await new Promise((resolve,reject)=>{



const results=    base('السير الذاتية').select({
 
  
 
  // filterByFormula: `({fldQ9pgJ6eRfUkUut}=="[recDMmtO84ydKHKiw]")`
// ,
  view: "الاساسي"
    }).all()
resolve(results)

  })
//  result.filter(e=>) 
  res.status(200).json(result);
}