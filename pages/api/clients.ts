// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
import jwt from "jwt-decode";
import type { NextApiRequest, NextApiResponse } from 'next'
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

type Data = {
  name: string
}


export default async function handler(req: NextApiRequest,res: NextApiResponse) {
  
try {
const result =  await new Promise((resolve,reject)=>{


    base('العملاء').select({
      //  fields:{}
        // Selecting the first 3 records in Grid view:
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
    
 resolve(records)       
//  fetchNextPage()
    }, function done(err) {
        if (err) { console.error(err); return; }
    });

 
})

  res.status(200).json(result)  
} catch (error) {
  console.log(error);
}

}

  // export base;