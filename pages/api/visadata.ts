import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { visaNumber, gender, profession, visaFile, nationality, clientID } = req.body;
    try {
      const visa = await prisma.visa.create({
        data: { 
          visaNumber, 
          gender, 
          profession, 
          visaFile, 
          nationality,
          clientID: Number(clientID),
        },
      });
      res.status(200).json(visa);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create visa' });
    }
  }

  if (req.method === 'GET') {
    const { clientID } = req.query;
    try {
      const visas = await prisma.visa.findMany({
        where: { clientID: Number(clientID) },
      });
      res.status(200).json(visas);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch visas' });
    }
  }

  if (req.method === 'PUT') {
    const { id, visaNumber, gender, profession, visaFile, nationality } = req.body;
    try {
      const visa = await prisma.visa.update({
        where: { id: Number(id) },
        data: { 
          visaNumber, 
          gender, 
          profession, 
          visaFile, 
          nationality,
        },
      });
      res.status(200).json(visa);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update visa' });
    }
  }

  // if (req.method === 'DELETE') {
  //   const { id } = req.query;
  //   try {
  //     const visa = await prisma.visa.delete({
  //       where: { id: Number(id) },
  //     });
  //     res.status(200).json({ message: 'Visa deleted successfully' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ error: 'Failed to delete visa' });
  //   }
  // }
}