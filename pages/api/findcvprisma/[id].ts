// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import Airtable, { Table } from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(req.query);
  console.log(req.query.pid);
  const find = await prisma.homemaid.findUnique({
    where: { id: Number(req.query.id) },
    include: {
      Housed: true,
      NewOrder: {
        // include: { arrivals: true },
        where: { HomemaidId: Number(req.query.id) },
        select: {
          HomemaidId: true,
          id: true,
          arrivals: true,
          profileStatus: true,
        },
      },
    },
  });
  // console.log(find?.);
  // sendSuggestion()
  //@ts-ignore
  // console.log(arr)
  // console.log(find?.NewOrder[0].HomemaidId);
  //@ts-ignore
  res.status(200).json(find);
}

// export base;
