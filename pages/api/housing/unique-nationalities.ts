import prisma from "../globalprisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const [homemaids, externalHomemaids, offices] = await Promise.all([
      prisma.homemaid.findMany({ select: { Nationalitycopy: true } }),
      prisma.externalHomedmaid.findMany({ select: { nationality: true } }),
      prisma.offices.findMany({ select: { Country: true } }),
    ]);

    const allNationalities = new Set<string>();
    homemaids.forEach((h) => {
      if (h.Nationalitycopy?.trim()) allNationalities.add(h.Nationalitycopy.trim());
    });
    externalHomemaids.forEach((e) => {
      if (e.nationality?.trim()) allNationalities.add(e.nationality.trim());
    });
    offices.forEach((o) => {
      if (o.Country?.trim()) allNationalities.add(o.Country.trim());
    });

    const sorted = Array.from(allNationalities).filter(Boolean).sort((a, b) => a.localeCompare(b, "ar"));

    return res.status(200).json({
      success: true,
      nationalities: sorted,
    });
  } catch (error: any) {
    console.error("Error fetching unique nationalities:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "خطأ في جلب الجنسيات",
    });
  }
}
