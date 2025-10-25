import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { notes, homemaid_id } = req.body;
    console.log(notes, homemaid_id);
    const newNote = await prisma.housedworker.update({
      where: {
        id: homemaid_id,
      },
      data: {
        Details: notes,

      },
    });
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}