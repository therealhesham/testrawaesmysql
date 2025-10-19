import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  if(req.method === 'GET'){
  const client = await prisma.client.findUnique({include:{visa:true, orders:true},
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

  res.status(200).json({data:client});
  }
  if(req.method === 'DELETE'){
    const { id } = req.body;
    const client = await prisma.client.delete({
      where: { id: Number(id) },
    });
  res.status(200).json({data:client});
  }
  if(req.method === 'PUT'){

      //  {
      //        id: 8,
      //        visaNumber: "584684848",
      //        gender: "male",
      //        profession: "عاملة منزلية",
      //        visaFile: "https://recruitmentrawaes.sgp1.digitaloceanspaces.com/contracts/order-visaFile-1760881192719.pdf",        
      //        nationality: "السعودية",
      //        clientID: 23,
      //        createdAt: "2025-10-19T13:39:54.952Z",
      //        updatedAt: "2025-10-19T13:39:54.952Z"
      //      }
    const { id } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data:{fullname: req.body.fullname, phonenumber: req.body.phonenumber, nationalId: req.body.nationalId, city: req.body.city},
    });
  res.status(200).json({data:client});
    
  }
  if(req.method === 'PATCH'){
    const { id } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: req.body,
    });
  res.status(200).json({data:client});
    }
}

