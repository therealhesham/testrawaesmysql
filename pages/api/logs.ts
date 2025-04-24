import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const { id, page } = req.query;

    try {
      const logs = await prisma.logs.findMany({
        where: { homemaidId: parseInt(Array.isArray(id) ? id[0] : id) },
        orderBy: { id: "desc" },
      });

      return res.status(200).json(logs);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching logs" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
