import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { calculateEscapeWarranty } from '../../../lib/escapesHelper';
import { jwtDecode } from 'jwt-decode';

const getUserFromReq = (req: NextApiRequest) => {
  try {
    let tokenStr = req.cookies?.authToken;
    if (!tokenStr && req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)authToken=([^;]+)/);
      if (match) tokenStr = decodeURIComponent(match[1]);
    }
    if (!tokenStr && req.headers.authorization?.startsWith('Bearer ')) {
      tokenStr = req.headers.authorization.substring(7);
    }
    if (tokenStr) {
      const token = jwtDecode(tokenStr) as any;
      const uid = Number(token.id || token.userId || token.sub);
      if (uid && !isNaN(uid)) {
        return { userId: uid, username: token.username || token.name || 'موظف' };
      }
    }
  } catch {}
  return { userId: null, username: null };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        escapeType,
        isWithinWarranty,
        visaFeeStatus,
        nationality,
        officeName,
        dateRange,
        status: statusQuery,
        search,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limit = Math.max(1, parseInt(pageSize as string, 10) || 10);
      const skip = (pageNum - 1) * limit;

      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const andConditions: any[] = [];
      const now = new Date();

      // Status filtering: 'recorded' (active escapes default), 'archive' (deported or returned to housing), or specific status
      if (statusQuery === 'archive') {
        andConditions.push({ status: { in: ['deported', 'returned_to_housing'] } });
      } else if (statusQuery && statusQuery !== 'all') {
        andConditions.push({ status: String(statusQuery) });
      } else if (!statusQuery) {
        andConditions.push({ status: 'recorded' });
      }

      if (escapeType && escapeType !== 'all') {
        andConditions.push({ escapeType: String(escapeType) });
      }

      if (nationality && nationality !== 'all') {
        andConditions.push({
          homeMaid: { Nationalitycopy: String(nationality) },
        });
      }

      if (officeName && officeName !== 'all') {
        andConditions.push({
          homeMaid: { officeName: String(officeName) },
        });
      }

      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        if (dateRange === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          andConditions.push({ escapeDate: { gte: today } });
        } else if (dateRange === 'week') {
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          andConditions.push({ escapeDate: { gte: lastWeek } });
        } else if (dateRange === 'month') {
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          andConditions.push({ escapeDate: { gte: lastMonth } });
        } else if (dateRange === 'quarter') {
          const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          andConditions.push({ escapeDate: { gte: lastQuarter } });
        } else if (dateRange === 'year') {
          const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          andConditions.push({ escapeDate: { gte: lastYear } });
        }
      }

      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      if (isWithinWarranty === 'true') {
        andConditions.push({ arrivalDate: { gte: ninetyDaysAgo } });
      } else if (isWithinWarranty === 'false') {
        andConditions.push({
          arrivalDate: {
            lt: ninetyDaysAgo,
            gte: twoYearsAgo,
          },
        });
      } else if (isWithinWarranty === 'over_2_years') {
        andConditions.push({
          arrivalDate: { lte: twoYearsAgo },
        });
      }

      if (visaFeeStatus && visaFeeStatus !== 'all') {
        andConditions.push({ visaFeeStatus: String(visaFeeStatus) });
      }

      if (search) {
        const query = String(search).trim();
        andConditions.push({
          OR: [
            { homeMaid: { Name: { contains: query } } },
            { homeMaid: { Passportnumber: { contains: query } } },
            { homeMaid: { officeName: { contains: query } } },
            { client: { fullname: { contains: query } } },
            { client: { phonenumber: { contains: query } } },
            { client: { nationalId: { contains: query } } },
            { order: { ClientName: { contains: query } } },
            { order: { nationalId: { contains: query } } },
            { notes: { contains: query } },
          ],
        });
      }

      const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

      const [escapes, totalCount] = await Promise.all([
        (prisma as any).workerEscape.findMany({
          where,
          include: {
            homeMaid: {
              select: {
                id: true,
                Name: true,
                Passportnumber: true,
                Nationalitycopy: true,
                officeName: true,
                job: true,
                Picture: true,
              },
            },
            client: {
              select: {
                id: true,
                fullname: true,
                phonenumber: true,
                nationalId: true,
              },
            },
            order: {
              select: {
                id: true,
                ClientName: true,
                nationalId: true,
                clientBookingStatus: true,
                bookingstatus: true,
              },
            },
          },
          orderBy: { escapeDate: 'desc' },
          skip,
          take: limit,
        }),
        (prisma as any).workerEscape.count({ where }),
      ]);

      // Enrich any escapes where homeMaid is null (e.g. external housed workers)
      const missingWorkerIds = escapes.filter((e: any) => !e.homeMaid).map((e: any) => e.homeMaidId);
      if (missingWorkerIds.length > 0) {
        const externalWorkers = await prisma.externalHomedmaid.findMany({
          where: { id: { in: missingWorkerIds } },
        });
        const extMap = new Map(externalWorkers.map((w: any) => [w.id, w]));
        for (const e of escapes) {
          if (!e.homeMaid && extMap.has(e.homeMaidId)) {
            const ext: any = extMap.get(e.homeMaidId);
            e.homeMaid = {
              id: ext.id,
              Name: ext.name,
              Passportnumber: ext.passportNumber || '—',
              Nationalitycopy: ext.nationality ? `عاملة خارجية (${ext.nationality})` : 'عاملة خارجية',
              job: 'عاملة منزلية',
              Picture: null,
            };
          }
        }
      }

      // Automatically resolve arrivalDate for escapes where arrivalDate is missing but exists in arrivals or tickets
      const missingArrivalEscapes = escapes.filter((e: any) => !e.arrivalDate);
      if (missingArrivalEscapes.length > 0) {
        for (const esc of missingArrivalEscapes) {
          try {
            const arr = await prisma.arrivallist.findFirst({
              where: {
                OR: [
                  ...(esc.orderId ? [{ OrderId: Number(esc.orderId) }] : []),
                  { HomemaIdnumber: Number(esc.homeMaidId) },
                  { Order: { HomemaidId: Number(esc.homeMaidId) } },
                  { Order: { HomemaidIdCopy: Number(esc.homeMaidId) } },
                ],
                KingdomentryDate: { not: null },
              },
              orderBy: { id: 'desc' },
              select: {
                KingdomentryDate: true,
                OrderId: true,
                SponsorIdnumber: true,
                Order: { select: { id: true, clientID: true } },
              },
            });

            let foundDate = arr?.KingdomentryDate ? new Date(arr.KingdomentryDate) : null;
            let foundOrderId = arr?.OrderId || arr?.Order?.id || null;
            let foundClientId = arr?.SponsorIdnumber || arr?.Order?.clientID || null;

            if (!foundDate) {
              const ticket = await prisma.tickets_details.findFirst({
                where: {
                  OR: [
                    ...(esc.orderId ? [{ order_id: Number(esc.orderId) }] : []),
                    { order: { HomemaidId: Number(esc.homeMaidId) } },
                    { order: { HomemaidIdCopy: Number(esc.homeMaidId) } },
                  ],
                  arrival_date: { not: null },
                },
                orderBy: { id: 'desc' },
                select: { arrival_date: true, order_id: true, order: { select: { id: true, clientID: true } } },
              });
              if (ticket?.arrival_date) {
                foundDate = new Date(ticket.arrival_date);
                foundOrderId = foundOrderId || ticket.order_id || ticket.order?.id || null;
                foundClientId = foundClientId || ticket.order?.clientID || null;
              }
            }

            if (foundDate) {
              esc.arrivalDate = foundDate;
              if (!esc.orderId && foundOrderId) esc.orderId = foundOrderId;
              if (!esc.clientId && foundClientId) esc.clientId = foundClientId;

              if (esc.escapeDate) {
                const startDay = new Date(foundDate.getFullYear(), foundDate.getMonth(), foundDate.getDate()).getTime();
                const escapeDay = new Date(new Date(esc.escapeDate).getFullYear(), new Date(esc.escapeDate).getMonth(), new Date(esc.escapeDate).getDate()).getTime();
                esc.daysSinceArrival = Math.max(0, Math.round((escapeDay - startDay) / (1000 * 60 * 60 * 24)));
                esc.isWithinWarranty = esc.daysSinceArrival <= 90;
              }

              // Persist in DB for future queries
              (prisma as any).workerEscape.update({
                where: { id: esc.id },
                data: {
                  arrivalDate: foundDate,
                  ...(foundOrderId ? { orderId: foundOrderId } : {}),
                  ...(foundClientId ? { clientId: foundClientId } : {}),
                  daysSinceArrival: esc.daysSinceArrival,
                  isWithinWarranty: esc.isWithinWarranty,
                },
              }).catch(() => {});
            }
          } catch (e) {}
        }
      }

      // Calculate summary counts for cards (only for active recorded escapes + archive)
      const [totalAll, airportCount, housingCount, trialCount, clientCount, warrantyCount, overTwoYearsCount, archiveCount, returnedCount, deportedCount] = await Promise.all([
        (prisma as any).workerEscape.count({ where: { status: 'recorded' } }),
        (prisma as any).workerEscape.count({ where: { escapeType: 'airport', status: 'recorded' } }),
        (prisma as any).workerEscape.count({ where: { escapeType: 'housing', status: 'recorded' } }),
        (prisma as any).workerEscape.count({ where: { escapeType: 'trial_transfer', status: 'recorded' } }),
        (prisma as any).workerEscape.count({ where: { escapeType: 'client', status: 'recorded' } }),
        (prisma as any).workerEscape.count({
          where: {
            status: 'recorded',
            arrivalDate: { gte: ninetyDaysAgo },
          },
        }),
        (prisma as any).workerEscape.count({
          where: {
            status: 'recorded',
            arrivalDate: { lte: twoYearsAgo },
          },
        }),
        (prisma as any).workerEscape.count({ where: { status: { in: ['deported', 'returned_to_housing'] } } }),
        (prisma as any).workerEscape.count({ where: { status: 'returned_to_housing' } }),
        (prisma as any).workerEscape.count({ where: { status: 'deported' } }),
      ]);

      // Enrich items with live arrival durations and current warranty state
      escapes.forEach((esc: any) => {
        if (esc.arrivalDate) {
          const arrTime = new Date(esc.arrivalDate).getTime();
          if (!isNaN(arrTime)) {
            const passed = Math.max(0, Math.round((now.getTime() - arrTime) / (1000 * 60 * 60 * 24)));
            esc.daysSinceArrivalToNow = passed;
            esc.isCurrentlyWithinWarranty = passed <= 90;
            esc.isOverTwoYears = passed >= 730;
          }
        }
      });

      const [availableNationalities, availableOffices] = await Promise.all([
        (prisma as any).homemaid.findMany({
          where: { Nationalitycopy: { not: null } },
          select: { Nationalitycopy: true },
          distinct: ['Nationalitycopy'],
        }).then((res: any[]) => res.map((r: any) => r.Nationalitycopy).filter(Boolean)).catch(() => []),
        (prisma as any).offices.findMany({
          select: { office: true },
          orderBy: { office: 'asc' },
        }).then((res: any[]) => res.map((r: any) => r.office).filter(Boolean)).catch(() => []),
      ]);

      return res.status(200).json({
        success: true,
        escapes,
        availableNationalities,
        availableOffices,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          currentPage: pageNum,
          pageSize: limit,
        },
        counts: {
          total: totalAll,
          airport: airportCount,
          housing: housingCount,
          trial_transfer: trialCount,
          client: clientCount,
          within_warranty: warrantyCount,
          outside_warranty: totalAll - warrantyCount,
          over_two_years: overTwoYearsCount,
          archive: archiveCount,
          returned: returnedCount,
          deported: deportedCount,
        },
      });
    } catch (error: any) {
      console.error('Error fetching escapes:', error);
      return res.status(500).json({ success: false, message: 'فشل في جلب بلاغات الهروب', error: error.message });
    }
  }

  if (req.method === 'POST') {
    const userInfo = getUserFromReq(req);
    if (!userInfo.userId) {
      return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول أولاً' });
    }

    try {
      const {
        escapeType, // 'airport' | 'housing' | 'trial_transfer' | 'client'
        homeMaidId,
        orderId,
        clientId,
        housedWorkerId,
        transferId,
        escapeDate,
        escapeTime,
        reportFile,
        notes,
        workerWageAmount,
        trialDaysCount,
        createdById,
      } = req.body;

      if (!escapeType || !homeMaidId || !escapeDate) {
        return res.status(400).json({ success: false, message: 'نوع الهروب ومعرف العاملة وتاريخ الهروب حقول مطلوبة' });
      }

      // 1. Fetch worker and arrival date from KingdomentryDate
      const maidId = Number(homeMaidId);
      let worker = await prisma.homemaid.findUnique({
        where: { id: maidId },
        include: {
          NewOrder: {
            take: 1,
            orderBy: { id: 'desc' },
            include: {
              arrivals: {
                take: 1,
                orderBy: { id: 'desc' },
              },
            },
          },
        },
      });

      if (!worker) {
        return res.status(400).json({
          success: false,
          message: 'العاملة غير مسجلة في استقدام المكتب (العاملات الخارجيات غير خاضعات لبلاغات هروب المكتب)',
        });
      }

      // Check if an active escape already exists for this worker
      const activeEscape = await (prisma as any).workerEscape.findFirst({
        where: {
          homeMaidId: maidId,
          status: 'recorded',
        },
      });
      if (activeEscape) {
        return res.status(400).json({
          success: false,
          message: `يوجد بلاغ هروب نشط ومفتوح بالفعل لهذه العاملة برقم #${activeEscape.id}، ولا يمكن تسجيل بلاغ جديد حتى يتم إغلاق البلاغ السابق واتخاذ إجراء عليه.`,
        });
      }

      // Try finding arrival date
      let arrivalDate: Date | null = null;
      let targetOrderId = orderId ? Number(orderId) : (worker?.NewOrder?.[0]?.id || null);
      let targetClientId = clientId ? Number(clientId) : (worker?.NewOrder?.[0]?.clientID ? Number(worker.NewOrder[0].clientID) : null);

      const arr = await prisma.arrivallist.findFirst({
        where: {
          OR: [
            ...(targetOrderId ? [{ OrderId: Number(targetOrderId) }] : []),
            { HomemaIdnumber: maidId },
            { Order: { HomemaidId: maidId } },
            { Order: { HomemaidIdCopy: maidId } },
          ],
          KingdomentryDate: { not: null },
        },
        orderBy: { id: 'desc' },
        select: {
          KingdomentryDate: true,
          OrderId: true,
          SponsorIdnumber: true,
          Order: { select: { id: true, clientID: true } },
        },
      });

      if (arr?.KingdomentryDate) {
        arrivalDate = new Date(arr.KingdomentryDate);
        targetOrderId = targetOrderId || arr.OrderId || arr.Order?.id || null;
        targetClientId = targetClientId || arr.SponsorIdnumber || arr.Order?.clientID || null;
      } else {
        const ticket = await prisma.tickets_details.findFirst({
          where: {
            OR: [
              ...(targetOrderId ? [{ order_id: Number(targetOrderId) }] : []),
              { order: { HomemaidId: maidId } },
              { order: { HomemaidIdCopy: maidId } },
            ],
            arrival_date: { not: null },
          },
          orderBy: { id: 'desc' },
          select: {
            arrival_date: true,
            order_id: true,
            order: { select: { id: true, clientID: true } },
          },
        });
        if (ticket?.arrival_date) {
          arrivalDate = new Date(ticket.arrival_date);
          targetOrderId = targetOrderId || ticket.order_id || ticket.order?.id || null;
          targetClientId = targetClientId || ticket.order?.clientID || null;
        }
      }

      const escDateObj = new Date(escapeDate);
      if (arrivalDate) {
        const startDay = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate()).getTime();
        const escapeDay = new Date(escDateObj.getFullYear(), escDateObj.getMonth(), escDateObj.getDate()).getTime();
        if (escapeDay < startDay) {
          return res.status(400).json({
            success: false,
            message: `تاريخ الهروب المدخل يسبق تاريخ وصول العاملة للمملكة (${arrivalDate.toLocaleDateString('ar-SA')}). يرجى التحقق من صحة تاريخ الهروب.`,
          });
        }
      }

      // 2. Calculate warranty status and 2,000 SAR fee
      const warrantyCalc = calculateEscapeWarranty(arrivalDate, escapeDate);

      // 4. Create worker_escapes entry
      const createdEscape = await (prisma as any).workerEscape.create({
        data: {
          escapeType,
          homeMaidId: maidId,
          orderId: targetOrderId,
          clientId: targetClientId,
          housedWorkerId: housedWorkerId ? Number(housedWorkerId) : null,
          transferId: transferId ? Number(transferId) : null,
          escapeDate: new Date(escapeDate),
          escapeTime: escapeTime || null,
          arrivalDate,
          daysSinceArrival: warrantyCalc.daysSinceArrival,
          isWithinWarranty: warrantyCalc.isWithinWarranty,
          visaFeeRequired: false,
          visaFeeAmount: 0,
          visaFeeStatus: 'none',
          reportFile: reportFile || null,
          notes: notes || null,
          workerWageAmount: workerWageAmount != null ? Number(workerWageAmount) : null,
          trialDaysCount: trialDaysCount != null ? Number(trialDaysCount) : null,
          createdById: createdById ? Number(createdById) : null,
        },
      });

      // 5. Context-specific actions:
      // 5. Context-specific actions:
      // Update worker status across homemaid to reflect the escape immediately and un-approve
      let homemaidBookingStatus = 'هروب';
      if (escapeType === 'airport') homemaidBookingStatus = 'هروب من المطار';
      else if (escapeType === 'housing') homemaidBookingStatus = 'هروب من السكن';
      else if (escapeType === 'client') homemaidBookingStatus = 'هروب من العميل';
      else if (escapeType === 'trial_transfer') homemaidBookingStatus = 'هروب أثناء التجربة';

      const escDateStr = new Date(escapeDate).toLocaleDateString('ar-SA');
      const escapeNoteEntry = `[بلاغ هروب (${homemaidBookingStatus}) بتاريخ ${escDateStr}]`;

      try {
        await prisma.homemaid.update({
          where: { id: maidId },
          data: {
            bookingstatus: homemaidBookingStatus,
            isApproved: false,
            notes: worker?.notes
              ? `${worker.notes.slice(0, 150)}\n${escapeNoteEntry}`.slice(0, 250)
              : escapeNoteEntry.slice(0, 250),
          },
        });
      } catch (maidErr) {
        console.error('Error updating homemaid on escape creation:', maidErr);
      }

      // Case A: Housing Escape
      if (escapeType === 'housing' && housedWorkerId) {
        try {
          await (prisma as any).housedworker.update({
            where: { id: Number(housedWorkerId) },
            data: {
              deparatureReason: 'الهروب من السكن',
              deparatureHousingDate: new Date(escapeDate),
              isActive: false,
              escapeData: {
                escapeDate,
                escapeTime: escapeTime || null,
                notes: notes || null,
                recordedAt: new Date().toISOString(),
              },
            },
          });

          // Free up active check-in bed in housing
          await prisma.checkIn.updateMany({
            where: { housedWorkerId: Number(housedWorkerId), isActive: true },
            data: { isActive: false },
          });
        } catch (hErr) {
          console.error('Error updating housing on escape:', hErr);
        }
      }

      // Case B: Airport Escape -> If reportFile is provided, treat it as deliveryFile in DeliveryDetails & close order
      if (escapeType === 'airport' && targetOrderId) {
        try {
          if (reportFile) {
            const existingDelivery = await prisma.deliveryDetails.findFirst({
              where: { newOrderId: Number(targetOrderId) },
            });

            if (existingDelivery) {
              await prisma.deliveryDetails.update({
                where: { id: existingDelivery.id },
                data: {
                  deliveryFile: reportFile,
                  deliveryDate: new Date(escapeDate),
                  deliveryNotes: notes ? `بلاغ هروب من المطار: ${notes}` : 'مرفق بلاغ هروب من المطار',
                  isDelivered: false,
                },
              });
            } else {
              await prisma.deliveryDetails.create({
                data: {
                  newOrderId: Number(targetOrderId),
                  deliveryFile: reportFile,
                  deliveryDate: new Date(escapeDate),
                  deliveryNotes: notes ? `بلاغ هروب من المطار: ${notes}` : 'مرفق بلاغ هروب من المطار',
                  isDelivered: false,
                  userId: createdById ? Number(createdById) : null,
                },
              });
            }
          }

          await (prisma as any).neworder.update({
            where: { id: Number(targetOrderId) },
            data: {
              bookingstatus: 'مغلق لهروب العاملة من المطار',
              clientBookingStatus: 'closed',
              isContractEnded: true,
            },
          });

          await prisma.arrivallist.updateMany({
            where: { OrderId: Number(targetOrderId) },
            data: {
              receiptMethod: 'airport_escape',
              DeliveryDate: new Date(escapeDate),
            },
          });
        } catch (oErr) {
          console.error('Error updating order on airport escape:', oErr);
        }
      }

      // Case C: Client Escape -> Document on client order
      if (escapeType === 'client' && targetOrderId) {
        try {
          const ord = await prisma.neworder.findUnique({
            where: { id: Number(targetOrderId) },
            select: { notes: true },
          });
          const ordNote = `[بلاغ هروب العاملة من العميل بتاريخ ${escDateStr}]`;
          await (prisma as any).neworder.update({
            where: { id: Number(targetOrderId) },
            data: {
              notes: ord?.notes ? `${ord.notes}\n${ordNote}` : ordNote,
            },
          });
        } catch (oErr) {
          console.error('Error documenting escape on client order:', oErr);
        }
      }

      // 6. تسجيل العملية في سجل أنشطة العاملة في بروفايلها (logs)
      try {
        const workerName = worker?.Name || 'عاملة';
        const warrantyLabel = warrantyCalc.isWithinWarranty ? 'ضمن فترة الضمان' : 'خارج فترة الضمان';
        const escapeDetailsText = `تسجيل بلاغ هروب [${homemaidBookingStatus}] بتاريخ ${escDateStr} - موقف الضمان: ${warrantyLabel}${notes ? ` - ملاحظات: ${notes}` : ''}`;

        await prisma.logs.create({
          data: {
            homemaidId: maidId,
            Status: 'بلاغ هروب',
            reason: homemaidBookingStatus,
            Details: escapeDetailsText,
            userId: String(userInfo.username || userInfo.userId),
          },
        });
      } catch (logErr) {
        console.error('Error logging to worker logs:', logErr);
      }

      // 7. تسجيل العملية في سجل عمليات النظام العام (systemUserLogs)
      try {
        const workerName = worker?.Name || 'عاملة';
        let clientName = '';
        if (targetClientId) {
          try {
            const cl = await prisma.client.findUnique({ where: { id: targetClientId }, select: { fullname: true } });
            clientName = cl?.fullname || '';
          } catch {}
        }
        if (!clientName && worker?.NewOrder?.[0]?.ClientName) {
          clientName = worker.NewOrder[0].ClientName;
        }

        const orderText = targetOrderId ? ` للطلب #${targetOrderId}` : '';
        const clientText = clientName ? ` (العميل: ${clientName})` : '';
        const timeText = escapeTime ? ` الساعة ${escapeTime}` : '';

        let actionText = '';
        let detailsText = '';

        if (escapeType === 'airport') {
          actionText = `تسجيل بلاغ هروب من المطار للعاملة #${maidId} (${workerName})${orderText}${clientText}`;
          detailsText = `تم تسجيل واقعة هروب العاملة من المطار بتاريخ ${escDateStr}${timeText}.${reportFile ? ' تم إرفاق ملف بلاغ الهروب واعتماده كمرفق استلام لإغلاق الطلب ونقله للمكتملة.' : ' لم يتم إرفاق ملف البلاغ بعد.'}${notes ? ` ملاحظات: ${notes}` : ''}`;
        } else if (escapeType === 'housing') {
          actionText = `تسجيل بلاغ هروب من السكن للعاملة #${maidId} (${workerName})`;
          detailsText = `تم تسجيل واقعة هروب العاملة من السكن بتاريخ ${escDateStr}${timeText}.${notes ? ` ملاحظات: ${notes}` : ''}`;
        } else if (escapeType === 'client') {
          const warrantyLabel = warrantyCalc.isWithinWarranty ? 'ضمن فترة الضمان' : 'خارج فترة الضمان';
          actionText = `تسجيل بلاغ هروب من العميل للعاملة #${maidId} (${workerName})${orderText}${clientText}`;
          detailsText = `تم تسجيل واقعة هروب العاملة من العميل بتاريخ ${escDateStr}${timeText}. موقف الضمان: ${warrantyLabel}.${notes ? ` ملاحظات: ${notes}` : ''}`;
        } else {
          actionText = `تسجيل بلاغ هروب (${homemaidBookingStatus}) للعاملة #${maidId} (${workerName})${orderText}`;
          detailsText = `تم تسجيل بلاغ هروب بتاريخ ${escDateStr}${timeText}.${notes ? ` ملاحظات: ${notes}` : ''}`;
        }

        await prisma.systemUserLogs.create({
          data: {
            userId: Number(userInfo.userId),
            actionType: 'إنشاء',
            action: actionText,
            beneficiary: workerName,
            BeneficiaryId: maidId,
            pageRoute: '/admin/escapes',
            details: detailsText,
          } as any,
        });
      } catch (sysErr) {
        console.error('Error logging to systemUserLogs:', sysErr);
      }

      return res.status(201).json({
        success: true,
        message: 'تم تسجيل بلاغ الهروب بنجاح',
        escape: createdEscape,
        warrantyCalc,
      });
    } catch (error: any) {
      console.error('Error recording escape:', error);
      return res.status(500).json({ success: false, message: 'فشل في تسجيل بلاغ الهروب', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
