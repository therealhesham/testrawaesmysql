import { NextApiRequest } from "next";
import { PrismaClient } from "@prisma/client";  
import { NextApiResponse } from "next";
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient();
  const id = req.query.id as string;
  try {
    console.log('Searching for contract:', id);
    
    // البحث في arrivallist من خلال InternalmusanedContract (مطابقة كاملة أو جزئية)
    const arrival = await prisma.arrivallist.findFirst({
      where: {
        OR: [
          { InternalmusanedContract: id },
          { InternalmusanedContract: { contains: id } },
        ],
      },
      include: {
        Order: {
          include: {
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
              },
            },
          },
        },
        Sponsor: {
          select: {
            id: true,
            fullname: true,
            phonenumber: true,
          },
        },
      },
    });

    console.log('Found arrival:', arrival ? 'Yes' : 'No');
    if (arrival) {
      console.log('InternalmusanedContract:', arrival.InternalmusanedContract);
      console.log('Has Order:', !!arrival.Order);
      console.log('Has Client:', !!arrival.Order?.client);
      console.log('Has Sponsor:', !!arrival.Sponsor);
    }

    if (arrival) {
      // استخدام بيانات العميل من Order أو من Sponsor
      const client = arrival.Order?.client || arrival.Sponsor;
      
      // إرجاع بيانات مشابهة لـ ClientAccountStatement
      const contract = {
        contractNumber: arrival.InternalmusanedContract || id,
        client: client ? {
          fullname: client.fullname,
        } : null,
        createdAt: arrival.Order?.createdAt || arrival.createdAt,
      };
      
      console.log('Returning contract:', contract);
      res.status(200).json(contract);
    } else {
      console.log('Contract not found for:', id);
      res.status(404).json({ error: 'Contract not found' });
    }
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  } finally {
    await prisma.$disconnect();
  }
}

export default handler;