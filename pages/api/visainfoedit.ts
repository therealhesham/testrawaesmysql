import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  if(req.method === 'PUT'){
    const visa = await prisma.visa.update({
      where: { id: Number(id) },
      data: req.body,
    });
  res.status(200).json(visa);
  }
}