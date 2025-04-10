// pages/api/checkins.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Get page and limit from query parameters, with defaults
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10; // Default limit
      const name = req.query.name || ""; // Search query
      const skip = (page - 1) * limit; // Calculate offset

      // Fetch paginated data
      const checkIns = await prisma.checkIn.findMany({
        where: {
          HousedWorker: {
            Order: { Name: { contains: name } },
          },
        },
        include: {
          HousedWorker: { where: { isActive: true }, include: { Order: true } },
        },
        skip: skip,
        take: limit,
        // orderBy: { CheckDate: "desc" },
      });

      // Get total count for pagination
      const totalCount = await prisma.checkIn.count({
        where: {
          HousedWorker: {
            Order: { Name: { contains: name } },
          },
        },
      });
      const totalPages = Math.ceil(totalCount / limit);
      // console.log(checkIns);
      // Return data and pagination info
      res.status(200).json({
        data: checkIns,
        totalPages: totalPages,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch check-ins" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
