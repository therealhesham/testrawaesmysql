// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const find = await prisma.neworder.findMany({
      where: { id:req.body.id },
    });
    // sendSuggestion()
    //@ts-ignore
    console.log(find);
    // console.log(arr)
    //@ts-ignore
    res.status(200).json({ data: find });
  } catch (error) {
    res.status(400).json({ error:"خطأ في الحذف"});

    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
}

// export base;
