//@ts-nocheck
//@ts-ignore
import Airtable, { Table } from "airtable";

var base = new Airtable({
  apiKey:
    "patqpqm8yUGAdhSoj.b42530f3bb52b3073c8a30eb1507a54227cb17fdc0d8ce0368ee61a8acf1c66d",
}).base("app1mph1VMncBBJid");

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const result = await new Promise((resolve, reject) => {
      const results = base("السير الذاتية")
        .select({
          fields: ["fld1k07dcF6YGJK2Z", "fldKKxbf5nHUYaBuw"],
          filterByFormula: `And(REGEX_MATCH({fld1k07dcF6YGJK2Z},"${id}"))`,
          view: "الاساسي",
        })
        .all();

      resolve(results);
    });

    // console.log(/);
    // Send the filtered and paginated data as the response
    res.status(200).json({ result: result[0].fields.Picture[0].url });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
}
