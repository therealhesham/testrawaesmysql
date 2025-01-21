//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from "jsonwebtoken";
const prisma=new PrismaClient()
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest,res: NextApiResponse) {
// sendSuggestion()
let arr = []
const result =  await new Promise((resolve,reject)=>{


const results=    base('السير الذاتية').select({
  fields:["م"," Name - الاسم"],
  view: "الاساسي"
    }).all()

 resolve(results)
})

// console.log(result.length)
  res.status(200).json(result)
}

  // export base;