// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable ,{Table} from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from 'next'
var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d'}).base('app1mph1VMncBBJid');

// var base = new Airtable({apiKey: 'patXrez1aIa2i3whF.410e92b1b07ab85712cd0722ad462964185aecd969949bde6e36295f7a2e8fc2'}).base('appUGFHsf0FQduyTw');
type Data = {
  name: string
}

export default async function handler(req: NextApiRequest,res: NextApiResponse) {
  console.log(req.query)
  console.log(req.query.pid)

// sendSuggestion()
      //@ts-ignore 

const arr=[];
  const result =  await new Promise((resolve,reject)=>{
    
     base('السير الذاتية').select({
      //@ts-nocheck
      //@ts-ignore
    view: "الاساسي"
}).eachPage(function page(records, fetchNextPage) {
    // This function (`page`) will get called for each page of records.


    records.forEach(function(record) {
      // console.log(req.query.pid)
      if(req.query.pid == record.get("م") ) arr.push(record);
      
    });
  


  //@ts-nocheck
  //@ts-ignore
  resolve(arr)
}, function done(err) {
    if (err) { console.error(err); return; }
});
})
// console.log(arr)
      //@ts-ignore 
  res.status(200).json(arr)
}

  // export base;