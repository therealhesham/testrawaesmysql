import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { searchTerm, action, page = '1' } = req.query;
    const pageSize = 10;
    const skip = (parseInt(page as string) - 1) * pageSize;

    try {
      const where = {
        ...(searchTerm && { action: { contains: searchTerm as string } }),
        ...(action && { action: action as string }),
      };

      const [logs, totalCount] = await Promise.all([
        prisma.systemUserLogs.findMany({
          where,
          skip,
          take: pageSize,
          include: { user: true },
        }),
        prisma.systemUserLogs.count({ where }),
      ]);

      return res.status(200).json({ logs, totalCount, page: parseInt(page as string) });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error fetching logs' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}