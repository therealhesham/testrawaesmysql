import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";



export default async function handler(req: NextApiRequest, res: NextApiResponse){

  const { id } = req.query;


  const find = await prisma.homemaid.findUnique({
    where: { id: Number(id) },
    include: {office:true,
      NewOrder: true,
      Client: true,
      Housed: true,
      inHouse: true,
      logs:true,
      Session: true,
    },
  });



  res.status(200).json(find);

}


