// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken"

import type { NextApiRequest, NextApiResponse } from 'next'
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

type Data = {
  name: string
}

export default async function handler(req: NextApiRequest,res: NextApiResponse) {
 
  // sendSuggestion()
      //@ts-ignore 

const arr=[];
  const result =  await new Promise((resolve,reject)=>{
      //@ts-ignore 

    base('المكاتب الخارجية').select({
      //@ts-ignore
      // fields:["office"],
        // Selecting the first 3 records in Grid view:
        view: "الاساسي"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record,s) {
            // console.log(s)
            // console.log('Retrieved', record.get("office"));
    // console.log(req.query.pid == record.get("office"))
    //@ts-ignore
    if(req.query.pid == record.get("External office - المكتب الخارجي") ) arr.push(record);
          });
      //@ts-ignore 
    // console.log(arr)
      //@ts-ignore 
 resolve(arr) 

    }, function done(err) {
        if (err) { console.error(err); return; }
    });

 
})
// console.log(result)

  res.send(result)
}

  // export base;