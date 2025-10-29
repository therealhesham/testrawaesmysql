import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const professions = await prisma.professions.findMany();
    res.status(200).json(professions);
  }
  if (req.method === 'POST') {
    const { name } = req.body;
    const profession = await prisma.professions.create({
      data: { name },
    });
    res.status(200).json(profession);
  }
  if (req.method === 'PUT') {
    const { id, name } = req.body;
    const profession = await prisma.professions.update({
      where: { id },
      data: { name },
    });
    res.status(200).json(profession);
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const profession = await prisma.professions.delete({
      where: { id },
    });
    res.status(200).json(profession);
  }
  if (req.method === 'GET') {
    const { id } = req.query as { id: string };
    const profession = await prisma.professions.findUnique({
      where: { id: Number(id) },
    });
    res.status(200).json(profession);
}}