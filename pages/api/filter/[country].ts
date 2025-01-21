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

export default async function handler(req,res: NextApiResponse) {
// sendSuggestion()
let arr = []
console.log(req.query)

try {
const result =  await new Promise((resolve,reject)=>{
  const {religion,country,experience}=req.query;
// console.log(religion,ironing,cleaning,cooking,babysitting,sewing,nationality,maritalstatus,education,experience,oldCare,arabic,experiencetype,english,laundry)
  // '(.*)'
const results=    base('السير الذاتية').select({
  
   filterByFormula:`And(REGEX_MATCH({fldUXlZQMZR89xcot},"${req.query.experience}"),REGEX_MATCH({fldkMkIksTxIHEN9k},"${req.query.country}"),REGEX_MATCH({fldEYaSy8nlV1btk6} ,"${req.query.religion}"))`
,        view: "الاساسي"
    }).all()
    
 resolve(results)
})
// console.log(result)
if(result.length == 0) return  res.status(300).json("data 0")
  res.status(200).json(result)
  
} catch (error) {
  console.log(error)
 res.status(300).json("data 0")
}

}

  // export base;