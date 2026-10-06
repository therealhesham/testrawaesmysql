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

    // 4. Search Transfer Sponsorship Transactions
    const transfers = await prisma.transferSponsorShips.findMany({
      where: {
        OR: [
          // العاملة (اسم، جواز، إقامة)
          { HomeMaid: { Name: { contains: queryStr } } },
          { HomeMaid: { Passportnumber: { contains: queryStr } } },
          { NationalID: { contains: queryStr } },
          // الكفيل الجديد (اسم، جوال، هاتف بديل، هوية)
          { NewClient: { fullname: { contains: queryStr } } },
          { NewClient: { phonenumber: { contains: queryStr } } },
          { NewClient: { alternativePhone: { contains: queryStr } } },
          { NewClient: { nationalId: { contains: queryStr } } },
          // الكفيل السابق (اسم، جوال، هوية)
          { OldClient: { fullname: { contains: queryStr } } },
          { OldClient: { phonenumber: { contains: queryStr } } },
          { OldClient: { nationalId: { contains: queryStr } } },
          // رقم المعاملة أو العملية
          { TransferOperationNumber: { contains: queryStr } },
          ...(numericQuery ? [{ id: numericQuery }] : []),
        ],
      },
      include: {
        HomeMaid: { select: { Name: true, Passportnumber: true } },
        NewClient: { select: { fullname: true, phonenumber: true, nationalId: true } },
        OldClient: { select: { fullname: true, phonenumber: true } },
      },
      take: 6,
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

    // Format Transfers (معاملات نقل الكفالة)
    transfers.forEach((transfer) => {
      const maidName = transfer.HomeMaid?.Name || "عاملة";
      const newSponsor = transfer.NewClient?.fullname || "كفيل جديد";
      const newSponsorPhone = transfer.NewClient?.phonenumber || "";
      const stage = transfer.transferStage || "نقل كفالة";

      results.push({
        type: "transfer",
        id: transfer.id,
        label: `نقل كفالة #${transfer.id} | العاملة: ${maidName} | الكفيل الجديد: ${newSponsor}${newSponsorPhone ? ` (${newSponsorPhone})` : ''}`,
        subLabel: stage,
        url: `/admin/AddTransactionForm?id=${transfer.id}`,
      });
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Global search error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
