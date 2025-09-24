import prisma from "../../../lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { search, limit = '10', contractType } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = Math.min(parseInt(limit as string) || 10, 100);

    // Build search conditions
    const searchConditions = {
      OR: [
        ...(parseInt(search) ? [{ id: parseInt(search) }] : []),
        { Name: { contains: search } },
        { Passportnumber: { contains: search } },
        { phone: { contains: search } }
      ]
    };

    // Search homemaids by ID, name, passport number, or phone
    const homemaids = await prisma.homemaid.findMany({
      where: {
        AND: [
          searchConditions,
          {
            bookingstatus: { 
              not: { in: ["booked", "new_order", "new_orders", "delivered", "cancelled", "rejected"] } 
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response
    const formattedHomemaids = homemaids.map(homemaid => ({
      id: homemaid.id,
      name: homemaid.Name,
      nationality: homemaid.Nationalitycopy,
      passportNumber: homemaid.Passportnumber,
      phone: homemaid.phone,
      age: homemaid.age,
      experience: homemaid.ExperienceYears,
      religion: homemaid.Religion,
      office: homemaid.office?.office,
      country: homemaid.office?.Country,
      picture: homemaid.Picture,
      bookingStatus: homemaid.bookingstatus,
      createdAt: homemaid.createdAt,
      // Add order information
      orders: homemaid.NewOrder?.map(order => ({
        id: order.id,
        bookingStatus: order.bookingstatus,
        profileStatus: order.profileStatus,
        createdAt: order.createdAt
      })) || [],
      hasOrders: homemaid.NewOrder && homemaid.NewOrder.length > 0
    }));

    res.status(200).json({
      success: true,
      homemaids: formattedHomemaids,
      total: formattedHomemaids.length
    });

  } catch (error) {
    console.error("Error searching homemaids:", error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    res.status(500).json({ 
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? "Internal Server Error" 
        : `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
