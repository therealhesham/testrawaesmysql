import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { query, limit = "10" } = req.query;
    const searchTerm = typeof query === "string" ? query.trim() : "";

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(200).json({ success: true, workers: [] });
    }

    const takeLimit = Math.min(Math.max(Number(limit) || 10, 1), 25);

    // 1. Search in externalHomedmaid by worker name, passport, phone, or client info
    const extMaids = await prisma.externalHomedmaid.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },
          { passportNumber: { contains: searchTerm } },
          { phone: { contains: searchTerm } },
          {
            Client: {
              OR: [
                { fullname: { contains: searchTerm } },
                { phonenumber: { contains: searchTerm } },
                { nationalId: { contains: searchTerm } },
              ],
            },
          },
        ],
      },
      include: {
        Client: true,
        housedworker: {
          orderBy: { id: "desc" },
          take: 3,
        },
      },
      take: takeLimit,
    });

    // 2. Also search transferSponsorShips to find external workers by their new sponsor (transferred client)
    // نضمن منع ظهور أي عاملة داخلية تماماً عبر اشتراط isExternal: true في HomeMaid
    const transfers = await prisma.transferSponsorShips.findMany({
      where: {
        HomeMaid: {
          isExternal: true, // حصر البحث في العاملات الخارجيات فقط
        },
        OR: [
          { NewClient: { fullname: { contains: searchTerm } } },
          { NewClient: { phonenumber: { contains: searchTerm } } },
          { NewClient: { nationalId: { contains: searchTerm } } },
          { HomeMaid: { Name: { contains: searchTerm } } },
          { HomeMaid: { Passportnumber: { contains: searchTerm } } },
        ],
      },
      include: {
        NewClient: true,
        OldClient: true,
        HomeMaid: true,
      },
      take: takeLimit,
    });

    const results: any[] = [];
    const seenPassportNumbers = new Set<string>();
    const seenExternalIds = new Set<number>();

    for (const m of extMaids) {
      // تحقق قاطع: منع ظهور أي عاملة تابعة للمكتب (عاملة داخلية) نهائياً
      // العاملة الداخلية تكون مسجلة في جدول homemaid وحقل isExternal ليس true
      const isInternalWorker = await prisma.homemaid.findFirst({
        where: {
          OR: [
            ...(m.passportNumber && m.passportNumber.trim() ? [{ Passportnumber: m.passportNumber.trim() }] : []),
            ...(m.name && m.name.trim() ? [{ Name: m.name.trim() }] : []),
          ],
          NOT: {
            isExternal: true,
          },
        },
      });

      if (isInternalWorker) {
        // عاملة داخلية تابعة للمكتب - استبعاد قاطع ولا تظهر في التسكين الخارجي نهائياً
        continue;
      }

      seenExternalIds.add(m.id);
      if (m.passportNumber) seenPassportNumbers.add(m.passportNumber.trim().toUpperCase());

      // Find latest transfer for this worker to detect current new sponsor
      let latestTransfer: any = null;
      if (m.passportNumber) {
        latestTransfer = await prisma.transferSponsorShips.findFirst({
          where: {
            HomeMaid: {
              Passportnumber: m.passportNumber.trim(),
            },
          },
          orderBy: { id: "desc" },
          include: { NewClient: true, OldClient: true },
        });
      }

      const currentClient = latestTransfer?.NewClient || m.Client;
      const prevClient = latestTransfer?.OldClient || (latestTransfer?.NewClient ? m.Client : null);
      const lastHousing = m.housedworker?.[0];

      results.push({
        id: m.id,
        externalHomemaidId: m.id,
        name: m.name,
        image: m.image,
        passportNumber: m.passportNumber,
        nationality: m.nationality,
        phone: m.phone,
        passportStartDate: m.passportStartDate,
        passportEndDate: m.passportEndDate,
        dateofbirth: m.dateofbirth ? m.dateofbirth.toISOString().split("T")[0] : null,
        currentClient: currentClient
          ? {
              id: currentClient.id,
              name: currentClient.fullname,
              phone: currentClient.phonenumber,
              nationalId: currentClient.nationalId,
              city: currentClient.city,
            }
          : null,
        previousClient: prevClient
          ? {
              id: prevClient.id,
              name: prevClient.fullname,
              phone: prevClient.phonenumber,
            }
          : null,
        lastHousingStatus: lastHousing?.deparatureReason || (lastHousing?.isActive ? "في السكن حالياً" : null),
        lastTransferStage: latestTransfer?.transferStage || null,
        housingCount: m.housedworker?.length || 0,
      });
    }

    // Include external workers identified via transferSponsorShips
    for (const t of transfers) {
      if (!t.HomeMaid || t.HomeMaid.isExternal !== true) continue;
      const pass = t.HomeMaid?.Passportnumber?.trim().toUpperCase();
      if (!pass || seenPassportNumbers.has(pass)) continue;

      const ext = await prisma.externalHomedmaid.findFirst({
        where: { passportNumber: pass },
        include: {
          Client: true,
          housedworker: {
            orderBy: { id: "desc" },
            take: 3,
          },
        },
      });

      if (ext && !seenExternalIds.has(ext.id)) {
        seenExternalIds.add(ext.id);
        seenPassportNumbers.add(pass);

        const lastHousing = ext.housedworker?.[0];
        results.push({
          id: ext.id,
          externalHomemaidId: ext.id,
          name: ext.name || t.HomeMaid?.Name,
          image: ext.image || (t.HomeMaid?.Picture as any)?.url,
          passportNumber: ext.passportNumber || t.HomeMaid?.Passportnumber,
          nationality: ext.nationality || t.HomeMaid?.Nationality || t.HomeMaid?.Nationalitycopy,
          phone: ext.phone || t.HomeMaid?.phone,
          passportStartDate: ext.passportStartDate,
          passportEndDate: ext.passportEndDate,
          dateofbirth: ext.dateofbirth ? ext.dateofbirth.toISOString().split("T")[0] : null,
          currentClient: t.NewClient
            ? {
                id: t.NewClient.id,
                name: t.NewClient.fullname,
                phone: t.NewClient.phonenumber,
                nationalId: t.NewClient.nationalId,
                city: t.NewClient.city,
              }
            : ext.Client
            ? {
                id: ext.Client.id,
                name: ext.Client.fullname,
                phone: ext.Client.phonenumber,
                nationalId: ext.Client.nationalId,
                city: ext.Client.city,
              }
            : null,
          previousClient: t.OldClient
            ? {
                id: t.OldClient.id,
                name: t.OldClient.fullname,
                phone: t.OldClient.phonenumber,
              }
            : null,
          lastHousingStatus: lastHousing?.deparatureReason || (lastHousing?.isActive ? "في السكن حالياً" : null),
          lastTransferStage: t.transferStage,
          housingCount: ext.housedworker?.length || 0,
        });
      }
    }

    return res.status(200).json({ success: true, workers: results });
  } catch (error: any) {
    console.error("Error in search-previous-external-workers:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

