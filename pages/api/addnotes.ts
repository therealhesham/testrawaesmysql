import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { notes, homemaid_id,employee,homemaidData } = req.body;
    console.log(notes, homemaid_id);
    const newNote = await prisma.housedWorkerNotes.create({
      data: {
        housedWorkerId: Number(homemaid_id),
        notes: notes,
      },select:{HousedWorker:{select:{homeMaid_id:true}}}
    });
// newNote.HousedWorker?.homeMaid_id
    try {
      await prisma.logs.create({
        data: {
          Status: `تم إضافة ملاحظة للعاملة المنزلية بتاريخ ${new Date().toLocaleDateString()}`,
          userId: employee,
          Details: `تم إضافة ملاحظة للعاملة المنزلية بتاريخ `,//حقول التعديل
          homemaidId: Number(newNote.HousedWorker?.homeMaid_id),
        },
      });
    } catch (error) {
      console.log(error)
    }
    res.status(200).json(newNote);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}