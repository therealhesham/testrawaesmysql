//@ts-ignore
//@ts-nocheck

import Airtable, { Table } from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
import jwt from "jwt-decode";
import type { NextApiRequest, NextApiResponse } from "next";
var base = new Airtable({
  apiKey:
    "patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d",
}).base("app1mph1VMncBBJid");

// var base = new Airtable({apiKey: 'patXrez1aIa2i3whF.410e92b1b07ab85712cd0722ad462964185aecd969949bde6e36295f7a2e8fc2'}).base('appUGFHsf0FQduyTw');

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // sendSuggestion()

  try {
    const result = await new Promise((resolve, reject) => {
      base("المكاتب الخارجية")
        .select({
          // Selecting the first 3 records in Grid view:
          view: "الاساسي",
        })
        .all();
    });

    // console.log(result)
    res.send(result);
  } catch (error) {}
}

// export base;
