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
  console.log(req.body);
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
          "Bearer patovGWItwsDoXzng.84565b10c27835cf1ac38c9f9b64e14a42a6ac3b825728e3970dffa94292577c",
        "Content-Type": "application/json",
      },
    };

    fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        console.log("Filtered Records:", data.records);
      })
      .catch((error) => {
        console.error("Error:", error);
      });

    const token = req.cookies.token;

    const decoder = jwt.verify(token, "secret");
    const finder = await prisma.user.findFirst({
      where: { idnumber: decoder?.idnumber },
    });
    if (finder.role != "adminstrator") return res.status(301).json("error");
  } catch (error) {
    console.log(error);
    res.status(301).json("error");
  }
  try {
    const result = await new Promise((resolve, reject) => {
      const create = base("السير الذاتية").create(req.body);

      resolve(create);
    });
    // console.log(result)
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(302).json({ error: "connectivity error" });
  }
}

// export base;
