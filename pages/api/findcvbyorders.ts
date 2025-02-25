import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const find = await prisma.neworder.findUnique({
    where: { id: Number(req.query.query) },
    include: {
      HomeMaid: { select: { officeName: true } },
      arrivals: { select: { InternalmusanedContract: true } },
    },
  });
  // sendSuggestion()
  //@ts-ignore
  // console.log(arr)
  // console.log(find?.NewOrder[0].HomemaidId);
  //@ts-ignore
  res.status(200).json(find);
}

// export base;
