import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { q } = req.query;

  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return res.status(200).json({ results: [] });
  }

  const queryStr = q.trim();
  const isNum = !isNaN(Number(queryStr));
  const numericQuery = isNum ? parseInt(queryStr, 10) : null;

  try {
    // 1. Search Clients
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { fullname: { contains: queryStr } },
          { nationalId: { contains: queryStr } },
          { phonenumber: { contains: queryStr } },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      take: 5,
    });

    // 2. Search HomeMaids
    const maids = await prisma.homemaid.findMany({
      where: {
        OR: [
          { Name: { contains: queryStr } },
          { Passportnumber: { contains: queryStr } },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      take: 5,
    });

    // 3. Search Orders
    const orders = await prisma.neworder.findMany({
      where: {
        OR: [
          { ClientName: { contains: queryStr } },
          { Name: { contains: queryStr } },
          { Passportnumber: { contains: queryStr } },
          { nationalId: { contains: queryStr } },
          { clientphonenumber: { contains: queryStr } },
          { HomeMaid: { Name: { contains: queryStr } } },
          { HomeMaid: { Passportnumber: { contains: queryStr } } },
          { client: { fullname: { contains: queryStr } } },
          { client: { nationalId: { contains: queryStr } } },
          { client: { phonenumber: { contains: queryStr } } },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      include: {
        client: { select: { fullname: true } },
        HomeMaid: { select: { Name: true } },
      },
      take: 5,
    });

    // Format the results for the frontend dropdown
    const results: any[] = [];

    // Format Clients
    clients.forEach((client) => {
      results.push({
        type: "client",
        id: client.id,
        label: `عميل: ${client.fullname || "بدون اسم"} - ${client.phonenumber || ""}`,
        url: `/admin/clientdetails?id=${client.id}`,
      });
    });

    // Format Maids
    maids.forEach((maid) => {
      results.push({
        type: "maid",
        id: maid.id,
        label: `عاملة: ${maid.Name || "بدون اسم"} - جواز: ${maid.Passportnumber || ""}`,
        url: `/admin/homemaidinfo?id=${maid.id}`,
      });
    });

    // Format Orders
    orders.forEach((order) => {
      const clientName = order.client?.fullname || order.ClientName || "عميل غير معروف";
      const maidName = order.HomeMaid?.Name || order.Name || "عاملة غير معروفة";
      
      results.push({
        type: "order",
        id: order.id,
        label: `طلب #${order.id} | العميل: ${clientName} | العاملة: ${maidName}`,
        url: `/admin/track_order/${order.id}`,
      });
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
