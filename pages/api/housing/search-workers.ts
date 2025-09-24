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
    const { search, limit = '10', contractType } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = parseInt(limit as string);

    // Search homemaids by ID, name, passport number, or phone
    // Only search homemaids that are linked to neworder table (have orders)
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
            NewOrder: {
              some: contractType ? {
                typeOfContract: contractType as string
              } : {} // Only homemaids that have at least one neworder record with specific contract type
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
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  } finally {
    await prisma.$disconnect();
  }
}