import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Name, age, Passportnumber, id, Nationality, page, SponsorName, OrderId } = req.query;
  console.log("Query Parameters:", req.query);

  const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

  const filters: any = {};
  if (id) filters.HomemaidId = Number(id);
  if (Name) filters.Name = { contains: String(Name).toLowerCase(), mode: "insensitive" };
  if (age) {
    const ageNum = parseInt(age as string, 10);
    if (!isNaN(ageNum)) {
      // Calculate birth year directly from current year minus age
      const currentYear = new Date().getFullYear();
      const targetBirthYear = currentYear - ageNum;
      
      // Search for birth year with tolerance of ±2 years
      filters.dateofbirth = {
        gte: new Date(`${targetBirthYear - 2}-01-01T00:00:00.000Z`).toISOString(),
        lte: new Date(`${targetBirthYear + 2}-12-31T23:59:59.999Z`).toISOString(),
      };
    }
  }
  if (Passportnumber) filters.Passportnumber = { contains: String(Passportnumber).toLowerCase(), mode: "insensitive" };
  if (Nationality) filters.Nationalitycopy = { contains: String(Nationality).toLowerCase(), mode: "insensitive" };
  if (SponsorName) filters.ClientName = { contains: String(SponsorName).toLowerCase(), mode: "insensitive" };
  if (OrderId) filters.id = Number(OrderId);

  console.log("Filters:", filters);

  try {
    const totalRecords = await prisma.neworder.count({
      where: {
        ...filters,
        HomemaidId: { gt: 0 },
        NOT: {
          bookingstatus: {
            in: ["delivered", "rejected"],
          },
        },
      },
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    const booked = await prisma.neworder.findMany({
      where: {
        ...filters,
        HomemaidId: { gt: 0 },
        NOT: {
          bookingstatus: {
            in: ["delivered", "rejected"],
          },
        },
      },
      orderBy: { id: "desc" },
      include: { HomeMaid: { include: { office: true } } },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    });

    res.status(200).json({ data: booked, totalPages });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}