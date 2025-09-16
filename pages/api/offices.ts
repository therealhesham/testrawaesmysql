import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const items = await prisma.offices.findMany({
        select: {
          id: true,
          office: true,
          Country: true,
          phoneNumber: true,
        },
        orderBy: { office: 'asc' }
      });

      return res.status(200).json({ success: true, items });
    } catch (error) {
      console.error('Offices API error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    // Handle non-GET requests
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}