import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  try {
    const { searchParams } = new URL(req.url as string);
  const amount = await prisma.minimumm.findFirst();
  return res.status(200).json({ amount })
  } catch (error) {
    console.error('Minimum API error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}