import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query: rawQuery } = req.query;

  if (!rawQuery || typeof rawQuery !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  const query = rawQuery.trim();
  const normalizedQuery = query
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  try {
    const orders = await prisma.neworder.findMany({
      where: {
        OR: [
          { ClientName: { contains: query } },
          { ClientName: { contains: normalizedQuery } },
          { PhoneNumber: { contains: query } },
          { nationalId: { contains: query } },
          { arrivals: { some: { InternalmusanedContract: { contains: query } } } },
          { HomeMaid: { Name: { contains: query } } },
          { HomeMaid: { Passportnumber: { contains: query } } },
          { client: { fullname: { contains: query } } },
          { client: { fullname: { contains: normalizedQuery } } },
        ],
      },
      include: {
        client: true,
        HomeMaid: {
          include: {
            office: true,
          },
        },
        arrivals: true,
      },
      take: 10,
    });

    // Format data for templates
    const orderIds = orders.map(o => o.id);
    let rawAmounts: any[] = [];
    if (orderIds.length > 0) {
      rawAmounts = await prisma.$queryRawUnsafe(
        `SELECT id, Total, paid FROM neworder WHERE id IN (${orderIds.join(',')})`
      );
    }
    const amountMap = new Map(rawAmounts.map(r => [r.id, { Total: r.Total, paid: r.paid }]));

    const formattedOrders = orders.map((order) => {
      const arrival = order.arrivals?.[0];
      const client = order.client;
      const worker = order.HomeMaid;
      const today = new Date();

      const rawVal = amountMap.get(order.id);
      const totalAmount = rawVal && rawVal.Total != null ? Number(rawVal.Total) : (order.Total || 0);

      return {
        id: order.id,
        displayTitle: `${order.ClientName || client?.fullname || 'بدون اسم'} - ${arrival?.InternalmusanedContract || 'بدون عقد'}`,
        data: {
          employer_name: order.ClientName || client?.fullname || '',
          employer_id: order.nationalId || client?.nationalId || '',
          client_name: order.ClientName || client?.fullname || '',
          id_number: order.nationalId || client?.nationalId || '',
          visa_number: arrival?.visaNumber || order.visaId?.toString() || '',
          visa_date: arrival?.visaIssuanceDate ? new Date(arrival.visaIssuanceDate).toISOString().split('T')[0] : '',
          coming_from: worker?.office?.Country || '',
          mobile: order.PhoneNumber || client?.phonenumber || '',
          mobile_1: order.PhoneNumber || client?.phonenumber || '',
          mobile_2: '', // Placeholder
          contract_number: arrival?.InternalmusanedContract || '',
          worker_name: worker?.Name || order.Name || '',
          worker_nationality: worker?.Nationalitycopy || order.Nationalitycopy || '',
          nationality: worker?.Nationalitycopy || order.Nationalitycopy || '',
          passport_number: worker?.Passportnumber || order.Passportnumber || '',
          address: client?.address || '',
          city: client?.city || '',
          handover_date: today.toISOString().split('T')[0],
          handover_day: new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(today),
          start_date: today.toISOString().split('T')[0],
          end_date: '', // Placeholder
          trial_days: '90',
          amount: totalAmount.toString(),
          contract_amount: totalAmount.toString(),
          arrival_date: arrival?.KingdomentryDate ? new Date(arrival.KingdomentryDate).toISOString().split('T')[0] : '',
          receive_date: today.toISOString().split('T')[0],
          birth_date: worker?.dateofbirth ? new Date(worker.dateofbirth).toISOString().split('T')[0] : '',
          worker_religion: worker?.Religion || order.Religion || '',
          worker_profession: worker?.job || '',
        },
      };
    });

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(500).json({ error: "Failed to search orders" });
  }
}
