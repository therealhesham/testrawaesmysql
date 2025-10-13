import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  if(req.method === 'GET'){
  const client = await prisma.client.findUnique({include:{visa:true},
    where: { id: Number(id) },
  });
  res.status(200).json(client);
  }
  if(req.method === 'POST'){
    const { id } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: req.body,
    });
  }
  if(req.method === 'DELETE'){
    const { id } = req.body;
    const client = await prisma.client.delete({
      where: { id: Number(id) },
    });
  }
  if(req.method === 'PUT'){
    const { id } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: req.body,
    });
  res.status(200).json(client);
    
  }
  if(req.method === 'PATCH'){
    const { id } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: req.body,
    });
  }
}

