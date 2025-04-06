import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { Passportnumber, Name, id } = req.query;

  try {
    // Prepare the where clause
    const whereClause = {
      Passportnumber: Passportnumber ? { contains: Passportnumber } : undefined,
      Name: Name ? { contains: Name } : undefined,
      id: id ? { equals: Number(id) } : undefined,
    };

    // Remove any undefined keys from the whereClause to prevent Prisma errors
    const filteredWhereClause = Object.fromEntries(
      Object.entries(whereClause).filter(([_, value]) => value !== undefined)
    );

    const homeMaids = await prisma.homemaid.findMany({
      take: 10,
      where: filteredWhereClause,
    });

    // Search for the homeMaid with the dynamic where clause

    if (!homeMaids.length) {
      return res
        .status(404)
        .json({ error: "No homemaid found matching the criteria" });
    }

    return res.status(200).json(homeMaids);
  } catch (error) {
    console.error("Error searching homemaid:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
}
