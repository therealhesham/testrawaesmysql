import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

if(req.method === 'POST'){
  const { visaNumber, gender, profession, visaFile, nationality, clientID } = req.body;
  const visa = await prisma.visa.create({
    data: { visaNumber, gender, profession, visaFile, nationality },
  });
  const client = await prisma.client.update({
    where: { id: clientID },
    data: { visa: { connect: { id: visa.id } } },
  });
  res.status(200).json(visa);
}
if(req.method === 'GET'){
  const { clientID } = req.query;
  const visa = await prisma.visa.findMany({
    where: { clientID: Number(clientID) },
  });
  res.status(200).json(visa);
}
if(req.method === 'PUT'){
  const { visaNumber, gender, profession, visaFile, nationality, clientID } = req.body;
    const visa = await prisma.visa.update({
    where: { id: clientID },
    data: { visaNumber, gender, profession, visaFile, nationality },
  });
  res.status(200).json(visa);
}
// if(req.method === 'DELETE'){
//   const { clientID } = req.query;
//   const visa = await prisma.visa.delete({
//     where: { id: clientID },
//     data: { visaNumber, gender, profession, visaFile, nationality },
//   });
//   res.status(200).json(visa);
// }



}