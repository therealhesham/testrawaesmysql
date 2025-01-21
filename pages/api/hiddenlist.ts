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
let arr = []
const result =  await new Promise((resolve,reject)=>{

// base('السير الذاتية').find
const results=    base('السير الذاتية').select({
  view: "الاساسي",
  
  // offset:10
  fields:["fldfmxECQcDVvcjvH","fldKKxbf5nHUYaBuw","fld1k07dcF6YGJK2Z","fldiWcMdEYNY6TJWy","fld0apYy0E2enqyWS","fldEYaSy8nlV1btk6","fldVp4gvVPuUJnbyR","fldeROrfXwANuBYX7","fldUXlZQMZR89xcot","fldkgrB3ZE5A38lh9","fldgFtv56XDjzWzKF","fld4CC8YwGvwrpjYD",
"fldLTVgq9xStOPmIV","fldzjT7W4eQmUkgJM","fldyKcHVYquQQMA3T",
"fldJDblLbnP2gqiOj" ],
// maxRecords:10
// pageSize:10
  // ,

  filterByFormula:`({fldIAYbOhnZkVnear}="Fales")`

    }).all()

 resolve(results)
})
console.log(result.length)

  res.status(200).json(result)
}

  // export base;