import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { clientId } = req.query;
  if (!clientId) {
    res.status(400).json({ message: 'Client ID is required' });
    return;
  }
  const orders = await prisma.neworder.findMany({
    where: { clientID: clientId },
  });
  res.status(200).json(orders);
}

export default handler;
