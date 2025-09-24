import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // منع التخزين المؤقت لتجنب 304
  res.setHeader('Cache-Control', 'no-store');

  try {
    const { search, limit = '10' } = req.query;

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);

    const homemaids = await prisma.homemaid.findMany({
      where: {
        OR: [
          { Name: { contains: search } },
          { Passportnumber: { contains: search } },
          { phone: { contains: search } }
        ],
        bookingstatus: { 
          not: { in: ["booked", "new_order", "new_orders", "delivered", "cancelled", "rejected"] } 
        }
      },
      select: {
        id: true,
        Name: true,
        Nationalitycopy: true,
        Passportnumber: true,
        phone: true,
        age: true,
        ExperienceYears: true,
        Religion: true,
        Picture: true,
        bookingstatus: true,
        createdAt: true,
        office: {
          select: {
            office: true,
            Country: true
          }
        }
      },
      take: limitNum,
      orderBy: {
        createdAt: 'desc'
      }
    });

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
      createdAt: homemaid.createdAt
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
