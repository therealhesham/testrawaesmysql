import { NextApiRequest, NextApiResponse ,} from "next";
import prisma from "./globalprisma";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { nationalId } = req.body;

  const client = await prisma.client.findFirst({ where: { nationalId } });

  if (client) {
    return res.status(200).json({ exists: true });
  }

  return res.status(200).json({ exists: false });
}