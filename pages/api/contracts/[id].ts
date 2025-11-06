import { NextApiRequest } from "next";
import { PrismaClient } from "@prisma/client";  
import { NextApiResponse } from "next";
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();
  const id = req.query.id as string;
  const contract = await prisma.clientAccountStatement.findFirst({
    where: {contractNumber: id },
    include: {
      client: {
        select: {
          fullname: true,
        },
      },
    },
  });
  res.status(200).json(contract);  
}

export default handler;