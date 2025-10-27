import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // جلب كل المواقع مع العاملين المرتبطين بيها
    const inLocations = await prisma.inHouseLocation.findMany({
      include: {
        housedWorkers: true,
      },
    });

    // تجميع البيانات حسب الموقع (location)
    const locationStats = inLocations.map(location => {
      const housedWorkersCount = location.housedWorkers.length;
      const quantity = location.quantity;
      const occupancyPercentage = quantity > 0 
        ? (housedWorkersCount / quantity) * 100 
        : 0; // لو quantity = 0، نرجع 0 عشان مفيش قسمة على صفر

      return {
        location: location.location,
        housedWorkersCount,
        quantity,
        occupancyPercentage: parseFloat(occupancyPercentage.toFixed(2)), // تقريب لرقمين عشريين
      };
    });

    res.status(200).json(locationStats);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
}