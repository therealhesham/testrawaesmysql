import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

function toEnDigits(str: string): string {
  return (str || '')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { type = 'housing', query = '' } = req.query;
    const rawSearch = String(query || '').trim();
    const searchTerm = toEnDigits(rawSearch).trim();
    const cleanIdStr = searchTerm.replace(/^#/, '').trim();
    const numericId = !isNaN(Number(cleanIdStr)) && cleanIdStr !== '' && /^\d+$/.test(cleanIdStr)
      ? Number(cleanIdStr)
      : null;

    // Fetch active escape IDs to exclude already-escaped workers across all categories
    const activeEscapes = await (prisma as any).workerEscape.findMany({
      where: { status: 'recorded' },
      select: { homeMaidId: true },
    });
    const activeEscapeIds: number[] = activeEscapes
      .map((e: any) => Number(e.homeMaidId))
      .filter((id: number) => !isNaN(id) && id > 0);
    const excludeEscapeIds = activeEscapeIds.length > 0 ? { notIn: activeEscapeIds } : undefined;

    // Compute actual live counts for all 4 categories (excluding workers with active recorded escapes)
    const [housingCount, airportArrForCount, trialTransferCount, clientCountData] = await Promise.all([
      prisma.housedworker.count({
        where: {
          deparatureHousingDate: null,
          deparatureReason: null,
          homeMaid_id: {
            not: null,
            ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
          },
        },
      }),
      prisma.arrivallist.findMany({
        where: {
          Order: {
            HomemaidId: {
              not: null,
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
          },
        },
        select: {
          DeliveryFile: true,
          receivingFile: true,
          Order: { select: { DeliveryDetails: { select: { deliveryFile: true } } } },
        },
      }),
      prisma.transferSponsorShips.count({
        where: {
          transferStage: { in: ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'] },
          NOT: { transferStage: 'فشلت التجربة' },
          OR: [{ ExperimentRate: null }, { ExperimentRate: { not: 'فاشلة' } }],
          HomeMaidId: {
            ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
          },
        },
      }),
      Promise.all([
        prisma.neworder.count({
          where: {
            HomemaidId: {
              not: null,
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
            OR: [
              { DeliveryDetails: { some: { deliveryFile: { not: null }, NOT: { deliveryFile: '' } } } },
              { arrivals: { some: { DeliveryFile: { not: null }, NOT: { DeliveryFile: '' } } } },
              { arrivals: { some: { receivingFile: { not: null }, NOT: { receivingFile: '' } } } },
            ],
          },
        }),
        prisma.transferSponsorShips.count({
          where: {
            HomeMaidId: {
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
            OR: [
              { transferStage: { in: ['تم نقل الكفالة', 'نقل الخدمات'] } },
              { ExperimentRate: 'ناجحة' },
            ],
          },
        }),
      ]),
    ]);

    const clientCount = clientCountData[0] + clientCountData[1];

    const airportCount = airportArrForCount.filter((a) => {
      const hasDelivery = Boolean(a.DeliveryFile && a.DeliveryFile.trim() !== '');
      const hasReceiving = Boolean(a.receivingFile && a.receivingFile.trim() !== '');
      const hasOrderDelivery = Boolean(
        a.Order?.DeliveryDetails?.some((d) => d.deliveryFile && d.deliveryFile.trim() !== '')
      );
      return !(hasDelivery || hasReceiving || hasOrderDelivery);
    }).length;

    const categoryCounts = {
      housing: housingCount,
      airport: airportCount,
      trial_transfer: trialTransferCount,
      client: clientCount,
    };

    // 1. Housing Escape: Office recruitment workers currently living in housing (exclude external & already-escaped)
    if (type === 'housing') {
      const housedSearchOr: any[] = [];
      if (searchTerm) {
        housedSearchOr.push(
          { Order: { Name: { contains: rawSearch } } },
          { Order: { Passportnumber: { contains: searchTerm } } },
          { Order: { NewOrder: { some: { ClientName: { contains: rawSearch } } } } },
          { Order: { NewOrder: { some: { clientphonenumber: { contains: searchTerm } } } } },
          { Order: { NewOrder: { some: { client: { fullname: { contains: rawSearch } } } } } },
          { Order: { NewOrder: { some: { client: { phonenumber: { contains: searchTerm } } } } } },
          { Order: { NewOrder: { some: { client: { nationalId: { contains: searchTerm } } } } } }
        );
        if (numericId !== null) {
          housedSearchOr.push(
            { homeMaid_id: numericId },
            { Order: { id: numericId } }
          );
        }
      }

      const housedWorkers = await prisma.housedworker.findMany({
        where: {
          deparatureHousingDate: null,
          deparatureReason: null,
          homeMaid_id: {
            not: null,
            ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
          },
          ...(housedSearchOr.length > 0 ? { OR: housedSearchOr } : {}),
        },
        include: {
          Order: {
            select: {
              id: true,
              Name: true,
              Passportnumber: true,
              Nationalitycopy: true,
              Picture: true,
              job: true,
              NewOrder: {
                take: 1,
                orderBy: { id: 'desc' },
                select: {
                  id: true,
                  ClientName: true,
                  clientphonenumber: true,
                  client: { select: { id: true, fullname: true, phonenumber: true, nationalId: true } },
                  arrivals: {
                    take: 1,
                    orderBy: { id: 'desc' },
                    select: { KingdomentryDate: true },
                  },
                },
              },
            },
          },
          location: {
            select: { id: true, location: true },
          },
        },
        orderBy: { houseentrydate: 'desc' },
      });

      const candidates = housedWorkers
        .filter((w) => w.homeMaid_id && w.Order)
        .map((w) => {
          const order = w.Order?.NewOrder?.[0];
          const arrival = order?.arrivals?.[0]?.KingdomentryDate || null;
          const clientNationalId = order?.client?.nationalId || null;

          return {
            homeMaidId: w.homeMaid_id!,
            housedWorkerId: w.id,
            isExternal: false,
            orderId: order?.id || null,
            clientId: order?.client?.id || null,
            name: w.Order?.Name || 'عاملة بالسكن',
            passport: w.Order?.Passportnumber || '—',
            nationality: w.Order?.Nationalitycopy || 'غير محدد',
            arrivalDate: arrival,
            houseentrydate: w.houseentrydate,
            location: w.location?.location || 'السكن الرئيسي',
            clientName: order?.client?.fullname || order?.ClientName || '—',
            clientPhone: order?.client?.phonenumber || order?.clientphonenumber || '',
            clientNationalId,
            categoryLabel: 'متواجدة حالياً بالسكن',
          };
        });

      return res.status(200).json({ success: true, type, candidates, categoryCounts });
    }

    // 2. Airport Escape: Workers in arrival list who haven't had a delivery receipt uploaded
    if (type === 'airport') {
      const airportSearchOr: any[] = [];
      if (searchTerm) {
        airportSearchOr.push(
          { HomeMaid: { Name: { contains: rawSearch } } },
          { HomeMaid: { Passportnumber: { contains: searchTerm } } },
          { ClientName: { contains: rawSearch } },
          { clientphonenumber: { contains: searchTerm } },
          { client: { fullname: { contains: rawSearch } } },
          { client: { phonenumber: { contains: searchTerm } } },
          { client: { nationalId: { contains: searchTerm } } }
        );
        if (numericId !== null) {
          airportSearchOr.push(
            { HomeMaid: { id: numericId } },
            { id: numericId }
          );
        }
      }

      const arrivals = await prisma.arrivallist.findMany({
        where: {
          Order: {
            HomemaidId: {
              not: null,
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
            ...(airportSearchOr.length > 0 ? { OR: airportSearchOr } : {}),
          },
        },
        include: {
          Order: {
            include: {
              HomeMaid: {
                select: { id: true, Name: true, Passportnumber: true, Nationalitycopy: true },
              },
              client: {
                select: { id: true, fullname: true, phonenumber: true, nationalId: true },
              },
              DeliveryDetails: {
                select: { id: true, deliveryFile: true },
              },
            },
          },
        },
        orderBy: { id: 'desc' },
      });

      const candidates = arrivals
        .filter((a) => {
          if (!a.Order?.HomeMaid) return false;

          // استبعاد أي عاملة تم رفع ملف سند الاستلام لها
          const hasDeliveryFileInArrival = Boolean(a.DeliveryFile && a.DeliveryFile.trim() !== '');
          const hasReceivingFileInArrival = Boolean(a.receivingFile && a.receivingFile.trim() !== '');
          const hasOrderDeliveryFile = Boolean(
            a.Order?.DeliveryDetails?.some((d) => d.deliveryFile && d.deliveryFile.trim() !== '')
          );

          if (hasDeliveryFileInArrival || hasReceivingFileInArrival || hasOrderDeliveryFile) {
            return false;
          }

          return true;
        })
        .map((a) => ({
          homeMaidId: a.Order!.HomeMaid!.id,
          orderId: a.OrderId || null,
          clientId: a.Order?.client?.id || a.SponsorIdnumber || null,
          name: a.Order?.HomeMaid?.Name || a.HomemaidName || 'عاملة وصول',
          passport: a.Order?.HomeMaid?.Passportnumber || a.PassportNumber || '—',
          nationality: a.Order?.HomeMaid?.Nationalitycopy || '—',
          arrivalDate: a.KingdomentryDate,
          location: a.arrivalSaudiAirport || 'مطار الوصول بالمملكة',
          clientName: a.Order?.client?.fullname || a.Order?.ClientName || a.SponsorName || '—',
          clientPhone: a.Order?.client?.phonenumber || a.SponsorPhoneNumber || '',
          clientNationalId: a.Order?.client?.nationalId || null,
          categoryLabel: 'قادمة عبر المطار (بانتظار الاستلام)',
        }));

      return res.status(200).json({ success: true, type, candidates, categoryCounts });
    }

    // 3. Trial Transfer Escape: Workers out on active trial transfer (exclude failed trials & already-escaped)
    if (type === 'trial_transfer') {
      const transferSearchOr: any[] = [];
      if (searchTerm) {
        transferSearchOr.push(
          { HomeMaid: { Name: { contains: rawSearch } } },
          { HomeMaid: { Passportnumber: { contains: searchTerm } } },
          { NewClient: { fullname: { contains: rawSearch } } },
          { NewClient: { phonenumber: { contains: searchTerm } } },
          { NewClient: { nationalId: { contains: searchTerm } } },
          { OldClient: { fullname: { contains: rawSearch } } },
          { OldClient: { phonenumber: { contains: searchTerm } } },
          { OldClient: { nationalId: { contains: searchTerm } } }
        );
        if (numericId !== null) {
          transferSearchOr.push(
            { HomeMaidId: numericId },
            { id: numericId }
          );
        }
      }

      const transfers = await prisma.transferSponsorShips.findMany({
        where: {
          transferStage: { in: ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'] },
          NOT: { transferStage: 'فشلت التجربة' },
          OR: [{ ExperimentRate: null }, { ExperimentRate: { not: 'فاشلة' } }],
          HomeMaidId: {
            ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
          },
          ...(transferSearchOr.length > 0 ? { OR: transferSearchOr } : {}),
        },
        include: {
          HomeMaid: {
            select: {
              id: true,
              Name: true,
              Passportnumber: true,
              Nationalitycopy: true,
            },
          },
          NewClient: {
            select: { id: true, fullname: true, phonenumber: true, nationalId: true },
          },
          OldClient: {
            select: { id: true, fullname: true, phonenumber: true, nationalId: true },
          },
        },
        orderBy: { id: 'desc' },
      });

      const candidates = transfers.map((t) => ({
        homeMaidId: t.HomeMaidId,
        transferId: t.id,
        clientId: t.NewClientId || null,
        name: t.HomeMaid?.Name || 'عاملة نقل كفالة',
        passport: t.HomeMaid?.Passportnumber || '—',
        nationality: t.HomeMaid?.Nationalitycopy || '—',
        trialStartDate: t.ExperimentStart || null,
        trialEndDate: t.ExperimentEnd || null,
        clientName: t.NewClient?.fullname || 'الكفيل الجديد التجريبي',
        clientPhone: t.NewClient?.phonenumber || '',
        clientNationalId: t.NewClient?.nationalId || null,
        categoryLabel: 'قيد تجربة نقل الكفالة',
      }));

      return res.status(200).json({ success: true, type, candidates, categoryCounts });
    }

    // 4. Client Escape: Workers delivered / with clients (orders with uploaded receipt + completed transfers)
    if (type === 'client') {
      const deliveredSearchOr: any[] = [];
      if (searchTerm) {
        deliveredSearchOr.push(
          { HomeMaid: { Name: { contains: rawSearch } } },
          { HomeMaid: { Passportnumber: { contains: searchTerm } } },
          { ClientName: { contains: rawSearch } },
          { clientphonenumber: { contains: searchTerm } },
          { client: { fullname: { contains: rawSearch } } },
          { client: { phonenumber: { contains: searchTerm } } },
          { client: { nationalId: { contains: searchTerm } } }
        );
        if (numericId !== null) {
          deliveredSearchOr.push(
            { HomemaidId: numericId },
            { id: numericId }
          );
        }
      }

      const completedSearchOr: any[] = [];
      if (searchTerm) {
        completedSearchOr.push(
          { HomeMaid: { Name: { contains: rawSearch } } },
          { HomeMaid: { Passportnumber: { contains: searchTerm } } },
          { NewClient: { fullname: { contains: rawSearch } } },
          { NewClient: { phonenumber: { contains: searchTerm } } },
          { NewClient: { nationalId: { contains: searchTerm } } }
        );
        if (numericId !== null) {
          completedSearchOr.push(
            { HomeMaidId: numericId },
            { id: numericId }
          );
        }
      }

      const [deliveredOrders, completedTransfers] = await Promise.all([
        prisma.neworder.findMany({
          where: {
            HomemaidId: {
              not: null,
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
            OR: [
              {
                DeliveryDetails: {
                  some: {
                    deliveryFile: { not: null },
                    NOT: { deliveryFile: '' },
                  },
                },
              },
              {
                arrivals: {
                  some: {
                    DeliveryFile: { not: null },
                    NOT: { DeliveryFile: '' },
                  },
                },
              },
              {
                arrivals: {
                  some: {
                    receivingFile: { not: null },
                    NOT: { receivingFile: '' },
                  },
                },
              },
            ],
            ...(deliveredSearchOr.length > 0 ? { OR: deliveredSearchOr } : {}),
          },
          include: {
            HomeMaid: {
              select: {
                id: true,
                Name: true,
                Passportnumber: true,
                Nationalitycopy: true,
              },
            },
            client: {
              select: { id: true, fullname: true, phonenumber: true, nationalId: true },
            },
            arrivals: {
              take: 1,
              orderBy: { id: 'desc' },
              select: {
                KingdomentryDate: true,
                DeliveryDate: true,
                DeliveryFile: true,
                receivingFile: true,
              },
            },
            DeliveryDetails: {
              take: 1,
              orderBy: { id: 'desc' },
              select: { deliveryDate: true, deliveryFile: true },
            },
          },
          orderBy: { id: 'desc' },
        }),
        prisma.transferSponsorShips.findMany({
          where: {
            HomeMaidId: {
              ...(excludeEscapeIds ? { notIn: activeEscapeIds } : {}),
            },
            OR: [
              { transferStage: { in: ['تم نقل الكفالة', 'نقل الخدمات'] } },
              { ExperimentRate: 'ناجحة' },
            ],
            ...(completedSearchOr.length > 0 ? { OR: completedSearchOr } : {}),
          },
          include: {
            HomeMaid: {
              select: {
                id: true,
                Name: true,
                Passportnumber: true,
                Nationalitycopy: true,
              },
            },
            NewClient: {
              select: { id: true, fullname: true, phonenumber: true, nationalId: true },
            },
          },
          orderBy: { id: 'desc' },
        }),
      ]);

      const orderCandidates = deliveredOrders
        .filter((o) => o.HomeMaid)
        .map((o) => {
          const receiptFile =
            o.DeliveryDetails?.[0]?.deliveryFile ||
            o.arrivals?.[0]?.DeliveryFile ||
            o.arrivals?.[0]?.receivingFile ||
            null;
          const deliveryDate =
            o.DeliveryDetails?.[0]?.deliveryDate ||
            o.arrivals?.[0]?.DeliveryDate ||
            null;

          return {
            homeMaidId: o.HomeMaid!.id,
            orderId: o.id,
            clientId: o.clientID || o.client?.id || null,
            name: o.HomeMaid?.Name || 'عاملة لدى عميل',
            passport: o.HomeMaid?.Passportnumber || '—',
            nationality: o.HomeMaid?.Nationalitycopy || '—',
            arrivalDate: o.arrivals?.[0]?.KingdomentryDate || null,
            deliveryDate,
            receiptFile,
            clientName: o.client?.fullname || o.ClientName || 'عميل مسجل',
            clientPhone: o.clientphonenumber || o.client?.phonenumber || '',
            categoryLabel: 'مستلمة بسند استلام لدى العميل',
          };
        });

      const transferCandidates = completedTransfers.map((t) => ({
        homeMaidId: t.HomeMaidId,
        orderId: null,
        transferId: t.id,
        clientId: t.NewClientId || null,
        name: t.HomeMaid?.Name || 'عاملة نقل كفالة',
        passport: t.HomeMaid?.Passportnumber || '—',
        nationality: t.HomeMaid?.Nationalitycopy || '—',
        arrivalDate: t.EntryDate || null,
        deliveryDate: t.TransferingDate ? new Date(t.TransferingDate).toISOString() : null,
        receiptFile: t.file || t.paymentReceiptFile || null,
        clientName: t.NewClient?.fullname || 'كفيل نقل الكفالة',
        clientPhone: t.NewClient?.phonenumber || '',
        categoryLabel: 'نقل كفالة مكتمل لدى العميل',
      }));

      const candidates = [...orderCandidates, ...transferCandidates];

      return res.status(200).json({ success: true, type, candidates, categoryCounts });
    }

    // Fallback: General homemaid search
    const maids = await prisma.homemaid.findMany({
      where: searchTerm
        ? {
            OR: [
              { Name: { contains: searchTerm } },
              { Passportnumber: { contains: searchTerm } },
            ],
          }
        : {},
      select: {
        id: true,
        Name: true,
        Passportnumber: true,
        Nationalitycopy: true,
      },
      take: 30,
    });

    const candidates = maids.map((m) => ({
      homeMaidId: m.id,
      name: m.Name,
      passport: m.Passportnumber || '—',
      nationality: m.Nationalitycopy || '—',
      categoryLabel: 'سجل العاملات',
    }));

    return res.status(200).json({ success: true, type, candidates, categoryCounts });
  } catch (error: any) {
    console.error('Error fetching escape candidates:', error);
    return res.status(500).json({ success: false, message: 'خطأ في جلب المرشحين', error: error.message });
  }
}
