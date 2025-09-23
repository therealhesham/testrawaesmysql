import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { search, limit = '10' } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = parseInt(limit as string);

    // Search homemaids by ID, name, passport number, or phone
    // Search for homemaids that are NOT linked to housedworker table (housedarrivals)
    const homemaids = await prisma.homemaid.findMany({
      where: {
        AND: [
          {
            OR: [
              { id: parseInt(search) || undefined },
              { Name: { contains: search } },
              { Passportnumber: { contains: search } },
              { phone: { contains: search } }
            ]
          },
          {
            // Only get homemaids that are NOT in housedworker table
            inHouse: {
              none: {} // This ensures no housedworker record exists for this homemaid
            }
          }
        ]
      },
      include: {
        office: {
          select: {
            id: true,
            office: true,
            Country: true
          }
        },
        NewOrder: {
          select: {
            id: true,
            bookingstatus: true,
            profileStatus: true,
            createdAt: true
          }
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedHomemaids = homemaids.map(worker => ({
      id: worker.id,
      name: worker.Name,
      nationality: worker.Nationalitycopy,
      passportNumber: worker.Passportnumber,
      phone: worker.phone,
      age: worker.age,
      office: worker.office?.office || 'غير محدد',
      country: worker.office?.Country || 'غير محدد',
      hasOrders: worker.NewOrder && worker.NewOrder.length > 0,
      orders: worker.NewOrder || []
    }));

    console.log(`Found ${homemaids.length} unlinked workers for search: "${search}"`);
    console.log('Sample unlinked worker data:', homemaids[0]);

    res.status(200).json({
      success: true,
      homemaids: formattedHomemaids,
      count: homemaids.length,
      searchTerm: search,
      message: 'العاملات غير المرتبطة بجدول housedarrivals',
      debug: {
        totalFound: homemaids.length,
        searchTerm: search,
        sampleWorker: homemaids[0] || null,
        isUnlinked: true
      }
    });

  } catch (error) {
    console.error('Error searching unlinked workers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching unlinked workers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
