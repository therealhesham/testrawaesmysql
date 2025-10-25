import { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { actionType,searchTerm, pageSize = '10',action, page = '1' } = req.query;
    console.log(actionType,searchTerm, pageSize,action, page);
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    try {
      let where: any = {};

      // لو فيه searchTerm فقط
      if (searchTerm && !action) {
        where = {
          OR: [
            { action: { contains: searchTerm as string } },
            { user: { username: { contains: searchTerm as string } } },
          ],
        };
      }

      // لو فيه action فقط
      else if (action && !searchTerm) {
        where = { actionType: action as string };
      }

 else if(action && searchTerm){
where = {
actionType:action,
OR:[

    { action: { contains: searchTerm as string } },
            { user: { username: { contains: searchTerm as string } } },

]


}


 }
 
      // لو مفيش ولا searchTerm ولا action
      else if (!searchTerm && !action) {
        where = {};
      }
// console.log(actionType ? actionType as string : undefined);
      const [logs, totalCount] = await Promise.all([
        prisma.systemUserLogs.findMany({
          where: {
            ...where,
            // actionType: action ? action as string : undefined,
          },
          skip,
          take: parseInt(pageSize as string),
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
