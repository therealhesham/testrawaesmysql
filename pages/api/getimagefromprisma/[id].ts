// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
//@ts-nocheck
//@ts-ignore
import { PrismaClient } from "@prisma/client";
import Airtable, { Table } from "airtable";
import { Console } from "console";
import Cookies from "js-cookie";
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
// var base = new Airtable({apiKey: 'patqpqm8yUGAdhSoj.56e6d82c73f5ec39152c7212d8c8a0710856aeb10ba0e268a2bb06a5cf919b06'}).base('app1mph1VMncBBJid');
var base = new Airtable({
  apiKey:
    "patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c",
}).base("app1mph1VMncBBJid");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.query);
  // sendSuggestion()
  try {
    const url =
      "https://api.airtable.com/v0/app1mph1VMncBBJid/السير الذاتية?filterByFormula={Name - الاسم}=" +
      req.query.id +
      "}";
    const options = {
      method: "GET",
      headers: {
        Authorization:
          "Bearer patBodVfcQQ0iIvcz.e577a4408fa0c7677c57740db3d3eb2be63f515495a13d2c2e23dbab1cdc6d9d",
        "Content-Type": "application/json",
      },
    };

    const f = await fetch(url, options);
    const m = await f.json();
    res.json(m);
  } catch (e) {
    console.log(e);
  }
}
// export base;
