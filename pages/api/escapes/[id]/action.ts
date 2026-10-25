import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  // Authentication check: reject unauthorized requests
  const userInfo = getUserFromReq(req);
  if (!userInfo.userId) {
    return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول أولاً' });
  }

  const { id } = req.query;
  const escapeId = Number(id);

  if (!escapeId || isNaN(escapeId)) {
    return res.status(400).json({ success: false, message: 'معرف البلاغ غير صالح' });
  }

  try {
    const escape = await (prisma as any).workerEscape.findUnique({
      where: { id: escapeId },
      include: {
        homeMaid: {
          include: {
            NewOrder: {
              take: 1,
              orderBy: { id: 'desc' },
              include: { arrivals: true },
            },
          },
        },
      },
    });

    if (!escape) {
      return res.status(404).json({ success: false, message: 'بلاغ الهروب غير موجود' });
    }

    // Protect against double execution or acting on an archived escape
    if (escape.status !== 'recorded') {
      const statusLabel =
        escape.status === 'returned_to_housing'
          ? 'تمت إعادة هذه العاملة للسكن مسبقاً'
          : escape.status === 'deported'
          ? 'تم ترحيل هذه العاملة مسبقاً'
          : 'تم اتخاذ إجراء على هذا البلاغ مسبقاً';
      return res.status(400).json({
        success: false,
        message: `${statusLabel} والبلاغ مغلق ومؤرشف حالياً، ولا يمكن إعادة تنفيذ الإجراء عليه مرة أخرى.`,
      });
    }

    const { actionType, deportationData, returnHousingData } = req.body;

    if (actionType === 'deportation') {
      const userInfo = getUserFromReq(req);
      const dd = deportationData || {};
      const validExtDepDate = dd.externaldeparatureDate ? new Date(dd.externaldeparatureDate) : new Date();
      const validExtArrDate = dd.externalArrivalCityDate ? new Date(dd.externalArrivalCityDate) : null;
      const targetOrderId = escape.orderId || escape.homeMaid?.NewOrder?.[0]?.id || null;

      await prisma.$transaction(async (tx) => {
        // 1. Link / update arrivallist
        const orderArrival = escape.homeMaid?.NewOrder?.[0]?.arrivals?.[0];
        if (orderArrival) {
          await tx.arrivallist.update({
            where: { id: orderArrival.id },
            data: {
              externaldeparatureCity: dd.externaldeparatureCity || null,
              externaldeparatureDate: validExtDepDate,
              externaldeparatureTime: dd.externaldeparatureTime || null,
              externalArrivalCity: dd.externalArrivalCity || null,
              externalArrivalCityDate: validExtArrDate,
              externalArrivalCityTime: dd.externalArrivalCityTime || null,
              externalTicketFile: dd.externalTicketFile || null,
              externalReason: dd.externalReason ? `ترحيل: ${dd.externalReason}` : 'ترحيل مباشر بعد هروب',
              deliveryOfficer: dd.deliveryOfficer || null,
              Notes: dd.notes
                ? `${dd.deportationEntity ? `الجهة المرحِّلة: ${dd.deportationEntity}. ` : ''}${dd.notes}`
                : (dd.deportationEntity ? `الجهة المرحِّلة: ${dd.deportationEntity}` : null),
            },
          });
        } else if (targetOrderId) {
          await tx.arrivallist.create({
            data: {
              OrderId: targetOrderId,
              HomemaIdnumber: escape.homeMaidId,
              externaldeparatureCity: dd.externaldeparatureCity || null,
              externaldeparatureDate: validExtDepDate,
              externaldeparatureTime: dd.externaldeparatureTime || null,
              externalArrivalCity: dd.externalArrivalCity || null,
              externalArrivalCityDate: validExtArrDate,
              externalArrivalCityTime: dd.externalArrivalCityTime || null,
              externalTicketFile: dd.externalTicketFile || null,
              externalReason: dd.externalReason ? `ترحيل: ${dd.externalReason}` : 'ترحيل مباشر بعد هروب',
              deliveryOfficer: dd.deliveryOfficer || null,
              Notes: dd.notes
                ? `${dd.deportationEntity ? `الجهة المرحِّلة: ${dd.deportationEntity}. ` : ''}${dd.notes}`
                : (dd.deportationEntity ? `الجهة المرحِّلة: ${dd.deportationEntity}` : null),
            },
          });
        }

        // 2. Update homemaid status to 'مغادرة خارجية'
        await tx.homemaid.update({
          where: { id: escape.homeMaidId },
          data: {
            bookingstatus: 'مغادرة خارجية',
            isApproved: false,
          },
        });

        // 3. If there is an active order, update its bookingstatus or hide
        if (targetOrderId) {
          await tx.neworder.update({
            where: { id: targetOrderId },
            data: {
              bookingstatus: 'مغادرة خارجية',
              isHidden: true,
            },
          });
        }

        // 4. Close housing record if worker had a housing record (Fix for Problem 6)
        const existingHw = escape.housedWorkerId
          ? await tx.housedworker.findUnique({ where: { id: escape.housedWorkerId } })
          : await tx.housedworker.findFirst({ where: { homeMaid_id: escape.homeMaidId } });

        if (existingHw) {
          await tx.housedworker.update({
            where: { id: existingHw.id },
            data: {
              deparatureReason: 'ترحيل عبر (سلسك) بعد هروب',
              deparatureHousingDate: validExtDepDate,
              actionTaken: 'ترحيل',
              isActive: false,
              deportationData: {
                deportationEntity: dd.deportationEntity || 'سلسك',
                externalArrivalCity: dd.externalArrivalCity || null,
                externaldeparatureDate: validExtDepDate,
                notes: dd.notes || null,
                deportedAt: new Date().toISOString(),
              },
            },
          });

          await tx.checkIn.updateMany({
            where: { housedWorkerId: existingHw.id, isActive: true },
            data: { isActive: false },
          });

          const depNote = [
            `[ترحيل مباشر عبر (سلسك) بعد هروب]`,
            `• تاريخ المغادرة: ${validExtDepDate.toISOString().split('T')[0]}`,
            `• الجهة المرحِّلة: ${dd.deportationEntity || 'الشركة السعودية للخدمات اللوجستية (سلسك)'}`,
            dd.externalArrivalCity ? `• الوجهة: ${dd.externalArrivalCity}` : null,
            dd.notes ? `• الملاحظات: ${String(dd.notes).trim()}` : null,
          ].filter(Boolean).join('\n');

          await tx.housedWorkerNotes.create({
            data: {
              housedWorkerId: existingHw.id,
              notes: depNote,
              employee: userInfo.username || 'إدارة السكن',
            },
          });
        }

        // 5. Update worker_escapes record
        const actionNotes = `[تم الترحيل المباشر بتاريخ ${new Date().toLocaleDateString('ar-SA')} - الجهة المرحِّلة: ${dd.deportationEntity || 'غير محدد'} - الوجهة: ${dd.externalArrivalCity || '—'}] ${dd.notes || ''}`;
        await (tx as any).workerEscape.update({
          where: { id: escapeId },
          data: {
            status: 'deported',
            notes: escape.notes ? `${escape.notes}\n${actionNotes}` : actionNotes,
          },
        });

        // 6. System activity logs
        const logDetails = `ترحيل العاملة (${escape.homeMaid?.Name || escape.homeMaidId}) عبر (سلسك) بعد بلاغ هروب - الوجهة: ${dd.externalArrivalCity || '—'}`;
        try {
          await tx.logs.create({
            data: {
              homemaidId: escape.homeMaidId,
              Details: logDetails,
              reason: 'ترحيل مباشر بعد هروب',
              Status: 'مغادرة خارجية',
              userId: String(userInfo.username || userInfo.userId),
            },
          });
        } catch {}

        if (userInfo.userId) {
          try {
            await (tx as any).systemUserLogs.create({
              data: {
                userId: userInfo.userId,
                actionType: 'UPDATE',
                action: `إدارة الهروب - ${logDetails}`,
                beneficiary: escape.homeMaid?.Name || 'عاملة',
                BeneficiaryId: escape.homeMaidId,
                pageRoute: '/admin/escapes',
                details: dd.notes ? `ملاحظات: ${dd.notes}` : logDetails,
              },
            });
          } catch {}
        }
      });

      return res.status(200).json({
        success: true,
        message: 'تم تسجيل الترحيل المباشر وتحديث بيانات الرحلة بنجاح',
      });
    }

    if (actionType === 'return_to_housing') {
      const userInfo = getUserFromReq(req);
      const rh = returnHousingData || {};
      const entryDate = rh.houseentrydate ? new Date(rh.houseentrydate) : new Date();
      const locationId = rh.location_id ? Number(rh.location_id) : null;
      // Fixed to the official housing reason: "تغييب عن العمل (هروب )"
      const reason = 'تغييب عن العمل (هروب )';
      const actionTaken = rh.actionTaken || 'ترحيل';
      const notes = rh.notes || '';

      await prisma.$transaction(async (tx) => {
        // Check if housedworker already exists
        const existingHoused = await tx.housedworker.findFirst({
          where: { homeMaid_id: escape.homeMaidId },
        });

        let targetHousedId = existingHoused?.id;

        if (existingHoused) {
          // If there were old details not already logged in HousedWorkerNotes, preserve them in notes
          if (existingHoused.Details && existingHoused.Details.trim()) {
            const oldDetails = existingHoused.Details.trim();
            const alreadyExists = await tx.housedWorkerNotes.findFirst({
              where: {
                housedWorkerId: existingHoused.id,
                notes: { contains: oldDetails },
              },
            });
            if (!alreadyExists) {
              try {
                await tx.housedWorkerNotes.create({
                  data: {
                    housedWorkerId: existingHoused.id,
                    notes: `[ملاحظات تسكين سابقة]: ${oldDetails}`,
                    employee: userInfo.username || 'إدارة السكن',
                  },
                });
              } catch (e) {
                console.error('Error saving previous details:', e);
              }
            }
          }

          await tx.housedworker.update({
            where: { id: existingHoused.id },
            data: {
              deparatureReason: null,
              deparatureHousingDate: null,
              houseentrydate: entryDate,
              location_id: locationId || existingHoused.location_id,
              Reason: reason,
              actionTaken: actionTaken,
              isActive: true,
              Details: notes ? String(notes).trim() : null,
            },
          });

          // Close any previous active checkins to avoid duplicate active beds
          await tx.checkIn.updateMany({
            where: { housedWorkerId: existingHoused.id, isActive: true },
            data: { isActive: false },
          });

          // Add checkin
          await tx.checkIn.create({
            data: {
              housedWorkerId: existingHoused.id,
              CheckDate: entryDate,
              isActive: true,
            },
          });
        } else {
          const createdHoused = await tx.housedworker.create({
            data: {
              homeMaid_id: escape.homeMaidId,
              houseentrydate: entryDate,
              location_id: locationId,
              Reason: reason,
              actionTaken: actionTaken,
              isActive: true,
              Details: notes ? String(notes).trim() : null,
              checkIns: {
                create: {
                  CheckDate: entryDate,
                  isActive: true,
                },
              },
            },
          });
          targetHousedId = createdHoused.id;
        }

        // Add detailed housing note in HousedWorkerNotes
        if (targetHousedId) {
          try {
            const dateStr = entryDate.toLocaleDateString('ar-EG');
            const noteLines = [
              `[إعادة للسكن بعد هروب]`,
              `• تاريخ الإرجاع: ${dateStr}`,
              `• سبب التسكين: ${reason}`,
              `• الإجراء المتخذ: ${actionTaken}`,
              notes ? `• الملاحظات: ${String(notes).trim()}` : null,
            ].filter(Boolean).join('\n');

            await tx.housedWorkerNotes.create({
              data: {
                housedWorkerId: targetHousedId,
                notes: noteLines,
                employee: userInfo.username || 'إدارة السكن',
              },
            });
          } catch (noteErr) {
            console.error('Error creating HousedWorkerNotes:', noteErr);
          }
        }

        // Update homemaid status: bookingstatus = 'في السكن', isApproved = false (CRITICAL: never approved!)
        const workerNoteEntry = `[إعادة للسكن بعد هروب بتاريخ ${new Date().toLocaleDateString('ar-SA')} - سبب التسكين: تغييب عن العمل (هروب ) - الإجراء: ${actionTaken}]`;
        await tx.homemaid.update({
          where: { id: escape.homeMaidId },
          data: {
            bookingstatus: 'في السكن',
            isApproved: false,
            notes: escape.homeMaid?.notes
              ? `${escape.homeMaid.notes.slice(0, 150)}\n${workerNoteEntry}`.slice(0, 250)
              : workerNoteEntry.slice(0, 250),
          },
        });

        // Update worker_escapes record
        const actionNotes = `[تمت الإعادة للسكن بتاريخ ${new Date().toLocaleDateString('ar-SA')} - سبب التسكين: ${reason} - الإجراء: ${actionTaken}] ${notes || ''}`;
        await (tx as any).workerEscape.update({
          where: { id: escapeId },
          data: {
            status: 'returned_to_housing',
            notes: escape.notes ? `${escape.notes}\n${actionNotes}` : actionNotes,
          },
        });

        // System activity logs (logs & systemUserLogs)
        const logDetails = `إعادة العاملة (${escape.homeMaid?.Name || escape.homeMaidId}) للسكن بعد بلاغ هروب - الإجراء: ${actionTaken} - سبب التسكين: تغييب عن العمل (هروب )`;
        try {
          await tx.logs.create({
            data: {
              homemaidId: escape.homeMaidId,
              Details: logDetails,
              reason: reason,
              Status: 'في السكن',
              userId: String(userInfo.username || userInfo.userId),
            },
          });
        } catch (logErr) {}

        if (userInfo.userId) {
          try {
            await (tx as any).systemUserLogs.create({
              data: {
                userId: userInfo.userId,
                actionType: 'UPDATE',
                action: `إدارة الهروب والسكن - ${logDetails}`,
                beneficiary: escape.homeMaid?.Name || 'عاملة',
                BeneficiaryId: escape.homeMaidId,
                pageRoute: '/admin/escapes',
                details: notes ? `ملاحظات: ${notes}` : logDetails,
              },
            });
          } catch (sysErr) {}
        }
      });

      return res.status(200).json({
        success: true,
        message: 'تمت إعادة العاملة للسكن وتسجيلها بنجاح',
      });
    }

    // ACTION: Attach Runaway Report File (بلاغ هروب)
    if (actionType === 'attach_report_file') {
      const { reportFile: newReportFile, notes: attachNotes } = req.body;
      if (!newReportFile) {
        return res.status(400).json({ success: false, message: 'يرجى رفع ملف بلاغ الهروب أولاً' });
      }

      const targetOrderId = escape.orderId || escape.homeMaid?.NewOrder?.[0]?.id || null;

      await prisma.$transaction(async (tx) => {
        // 1. Update escape record with reportFile
        await (tx as any).workerEscape.update({
          where: { id: escapeId },
          data: {
            reportFile: newReportFile,
            ...(attachNotes ? { notes: escape.notes ? `${escape.notes}\n${attachNotes}` : attachNotes } : {}),
          },
        });

        // 2. If airport escape and linked to an order, treat report file as deliveryFile in DeliveryDetails
        if (escape.escapeType === 'airport' && targetOrderId) {
          const existingDelivery = await tx.deliveryDetails.findFirst({
            where: { newOrderId: Number(targetOrderId) },
          });

          if (existingDelivery) {
            await tx.deliveryDetails.update({
              where: { id: existingDelivery.id },
              data: {
                deliveryFile: newReportFile,
                deliveryDate: escape.escapeDate,
                deliveryNotes: attachNotes ? `بلاغ هروب من المطار: ${attachNotes}` : 'مرفق بلاغ هروب من المطار',
                isDelivered: false,
              },
            });
          } else {
            await tx.deliveryDetails.create({
              data: {
                newOrderId: Number(targetOrderId),
                deliveryFile: newReportFile,
                deliveryDate: escape.escapeDate,
                deliveryNotes: attachNotes ? `بلاغ هروب من المطار: ${attachNotes}` : 'مرفق بلاغ هروب من المطار',
                isDelivered: false,
                userId: userInfo.userId,
              },
            });
          }

          // Ensure order is closed and ended
          await tx.neworder.update({
            where: { id: Number(targetOrderId) },
            data: {
              bookingstatus: 'مغلق لهروب العاملة من المطار',
              clientBookingStatus: 'closed',
              isContractEnded: true,
            },
          });
        }

        // 3. System & Worker Logs
        try {
          await tx.logs.create({
            data: {
              Details: `تم إرفاق ملف بلاغ الهروب من المطار واعتباره كمرفق استلام لإغلاق الطلب`,
              Status: 'إرفاق بلاغ هروب',
              homemaidId: escape.homeMaidId,
              userId: String(userInfo.username || userInfo.userId),
            },
          });
        } catch {}

        try {
          await (tx as any).systemUserLogs.create({
            data: {
              userId: userInfo.userId,
              actionType: 'UPDATE',
              action: `إرفاق بلاغ هروب من المطار كمرفق استلام للطلب #${targetOrderId || '—'}`,
              beneficiary: escape.homeMaid?.Name || 'عاملة',
              BeneficiaryId: escape.homeMaidId,
              pageRoute: '/admin/escapes',
              details: `تم إرفاق ملف بلاغ الهروب واعتباره كمرفق تسليم/استلام لإغلاق الطلب ونقله للمكتملة`,
            },
          });
        } catch {}
      });

      return res.status(200).json({
        success: true,
        message: 'تم حفظ وإرفاق ملف بلاغ الهروب بنجاح واعتباره كمرفق استلام للطلب',
      });
    }

    return res.status(400).json({ success: false, message: 'نوع الإجراء غير معروف' });
  } catch (error: any) {
    console.error('Error executing escape action:', error);
    return res.status(500).json({ success: false, message: error.message || 'فشل في تنفيذ الإجراء' });
  }
}
