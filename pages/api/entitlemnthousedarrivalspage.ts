import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, entitlementsCost, entitlementReason } = req.body;
      const entitlements = await prisma.housedworker.update({
    where: {
      id: id,
     
     
      // homeMaid_id: homeMaidId,
    },
    data: {
      entitlementReason: entitlementReason,
      entitlementsCost: entitlementsCost,
    },
  });
  return res.status(200).json(entitlements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating entitlements" });
  }

}