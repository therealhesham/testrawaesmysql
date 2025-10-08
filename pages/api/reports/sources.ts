import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if(req.method === 'POST '){

return res.status(405).json({ message: 'Method not allowed' });
}

const in_progress = await prisma.client.findMany({
  distinct: ['Source'],
  select: { Source: true },
});

res.status(200).json({ in_progress_length: in_progress });
}







