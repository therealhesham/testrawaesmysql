import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clientId, nationality } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // البحث عن التأشيرات المتاحة للعميل
    const availableVisas = await prisma.visa.findMany({
      where: {
        clientID: Number(clientId),
        // التأشيرات التي تطابق الجنسية المطلوبة (إذا تم تحديدها)
        ...(nationality && { nationality: nationality as string }),
        // التأشيرات التي ليس لها طلبات مرتبطة أو الطلبات المرتبطة بها ملغاة/مرفوضة
        OR: [
          {
            orders: {
              none: {}
            }
          },
          {
            orders: {
              every: {
                bookingstatus: {
                  in: ['cancelled', 'rejected', 'delivered']
                }
              }
            }
          }
        ]
      },
      include: {
        orders: {
          select: {
            id: true,
            bookingstatus: true
          }
        }
      }
    });

    // فلترة التأشيرات للتأكد من أنها متاحة فعلياً
    const trulyAvailableVisas = availableVisas.filter(visa => {
      // إذا لم يكن هناك طلبات، التأشيرة متاحة
      if (visa.orders.length === 0) return true;
      
      // إذا كانت جميع الطلبات ملغاة/مرفوضة/مسلمة، التأشيرة متاحة
      return visa.orders.every(order => 
        ['cancelled', 'rejected', 'delivered'].includes(order.bookingstatus || '')
      );
    });

    return res.status(200).json({
      success: true,
      visas: trulyAvailableVisas.map(visa => ({
        id: visa.id,
        visaNumber: visa.visaNumber,
        nationality: visa.nationality,
        gender: visa.gender,
        profession: visa.profession,
        visaFile: visa.visaFile,
        createdAt: visa.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching available visas:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: (error as Error).message 
    });
  }
}

