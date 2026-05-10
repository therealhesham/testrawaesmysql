import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import { getBookingQuotaWindow } from "lib/bookingGenderQuota";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { start, end } = getBookingQuotaWindow();

    // Find all orders that have a contract date in this window
    // We look at arrivallist where DateOfApplication is within [start, end]
    const orders = await prisma.neworder.findMany({
      where: {
        arrivals: {
          some: {
            DateOfApplication: {
              gte: start,
              lte: end,
            },
          },
        },
        bookingstatus: {
          notIn: ["cancelled", "rejected", "Cancelled", "Rejected"],
        },
      },
      select: {
        id: true,
        HomeMaid: {
          select: {
            profession: {
              select: {
                gender: true,
              },
            },
          },
        },
      },
    });

    let maleCount = 0;
    let femaleCount = 0;
    let otherCount = 0;

    for (const order of orders) {
      const genderRaw = order.HomeMaid?.profession?.gender;
      const g = (genderRaw ?? "").trim().toLowerCase();
      
      if (g === "male" || g === "m" || g === "ذكر") {
        maleCount++;
      } else if (g === "female" || g === "f" || g === "أنثى" || g === "انثى") {
        femaleCount++;
      } else {
        otherCount++;
      }
    }

    const total = maleCount + femaleCount + otherCount;
    const malePercentage = total > 0 ? (maleCount / total) * 100 : 0;

    // Get the limit from database - strict check as per user request
    const cfg = await prisma.percentage.findFirst({
      orderBy: { id: "desc" },
      select: { malePercentage: true },
    });

    if (!cfg || cfg.malePercentage == null) {
      return res.status(404).json({ error: "Percentage settings not found in database" });
    }
    
    const limit = Number(cfg.malePercentage);

    return res.status(200).json({
      maleCount,
      femaleCount,
      otherCount,
      total,
      malePercentage,
      limit,
      window: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error calculating contract gender quota:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
