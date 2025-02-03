//@ts-ignore
//@ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { PrismaClient } from "@prisma/client";
import Airtable, { Table } from "airtable";

import { Console } from "console";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();
  const page = req.query.id - 1;
  console.log(page);
  const find = await prisma.neworder.findMany({
    select: {
      age: true,
      ages: true,
      id: true,
      Name: true,
      ClientName: true,
      clientphonenumber: true,
      Passportnumber: true,
      Religion: true,
      HomemaidIdCopy: true,
      createdAt: true,
      Experience: true,
      HomemaidId: true,
      ExperienceYears: true,
    },
    orderBy: { id: "desc" },
    skip: page * 10,
    take: 10,
    where: { bookingstatus: "حجز جديد" },
  });

  // console.log(find[0]);
  const count = await prisma.neworder.count();
  res.status(200).json({ data: find });
}

// export base;
