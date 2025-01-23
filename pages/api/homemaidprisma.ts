//@ts-nocheck

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // await prisma..
    const createAdmin = await prisma.homemaid.findMany({
      where: { NewOrder: { every: { HomemaidId: null } } },
    });
    res.status(200).send(createAdmin.length);
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // res.send("error")
  }
}
