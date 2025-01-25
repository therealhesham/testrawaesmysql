//@ts-nocheck

import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Execute your Prisma query
    const createAdmin = await prisma.homemaid.findMany({
      where: { NewOrder: { every: { HomemaidId: null } } },
    });

    // Send the response back
    res.status(200).send(createAdmin);
  } catch (error) {
    console.log(error);
    res.status(301).send("createAdmin");

    // Optional: Handle specific errors if necessary
  } finally {
    // Disconnect Prisma Client regardless of success or failure
    await prisma.$disconnect();
  }
}
