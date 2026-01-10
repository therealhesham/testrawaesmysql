import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { Name, age, Passportnumber, id, pageSizeQ,Nationality, page, SponsorName, OrderId, date } = req.query;

  // const pageSize = 10;
  const pageNumber = parseInt(page as string, 10) || 1;

const pageSize = Number(pageSizeQ);

  const filters: any = {};
  // if (id) filters.HomemaidId = Number(id);
  if (Name) filters.Name = { contains: String(Name).toLowerCase() };
  
  if (Passportnumber) filters.Passportnumber = { contains: String(Passportnumber).toLowerCase() };
  if (Nationality) filters.office = {Country:{ contains: String(Nationality).toLowerCase() }};
  if (SponsorName) filters.ClientName = { contains: String(SponsorName).toLowerCase() };
  if (OrderId) filters.id = Number(OrderId);
  if (date) {
  const dateValue = new Date(String(date));
  if (!isNaN(dateValue.getTime())) {
    const startOfDay = new Date(dateValue);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateValue);
    endOfDay.setHours(23, 59, 59, 999);

    filters.dateofbirth = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }
}


  try {
    const totalRecords = await prisma.homemaid.count({
      where: {
        OR: [
          { NewOrder: { every: { HomemaidId: null } } },
          { NewOrder: { some: { bookingstatus: { in: ["cancelled", "rejected"] } } } }
        ],
        ...filters
      },
    });
    const totalPages = Math.ceil(totalRecords / pageSize);

    const data = await prisma.homemaid.findMany({
      where: {
        OR: [
          { NewOrder: { every: { HomemaidId: null } } },
          { NewOrder: { some: { bookingstatus: { in: ["cancelled", "rejected"] } } } }
        ],
        ...filters
      },
      include: { NewOrder: true, office: {select:{Country:true}} },
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: {
        id: 'desc',
      },
    });

    res.status(200).json({ data, totalPages });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    await prisma.$disconnect();
  }
}