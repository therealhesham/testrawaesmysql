import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { officeName, type, page = 1, limit = 10 } = req.query;

  // if (!officeName || !type || !['sent', 'inbox'].includes(type)) {
  //   return res.status(400).json({ error: 'Invalid officeName or type' });
  // }
// if(type != "sent" ||"inbox")  {const where={}}
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
console.log(type)
    const where = {
      // officeName,
      type :type==""?{not:{equals:"cs"}}:type,
    };

    const [messages, total] = await Promise.all([
      prisma.officemssages.findMany({
        where,
        select: {
          id: true,
          title: true,
          sender: true,
          officeName:true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.officemssages.count({ where }),
    ]);

    res.status(200).json({
      messages,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}