import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { calculateEscapeWarranty } from '../../../../lib/escapesHelper';
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
  const { id } = req.query;
  const escapeId = Number(id);

  if (!escapeId || isNaN(escapeId)) {
    return res.status(400).json({ success: false, message: 'معرف البلاغ غير صالح' });
  }

  const userInfo = getUserFromReq(req);
  if (!userInfo.userId) {
    return res.status(401).json({ success: false, message: 'غير مصرح، يرجى تسجيل الدخول أولاً' });
  }

  // GET single escape details
  if (req.method === 'GET') {
    try {
      const escape = await (prisma as any).workerEscape.findUnique({
        where: { id: escapeId },
        include: {
          homeMaid: true,
          order: {
            include: {
              client: true,
              arrivals: true,
            },
          },
          client: true,
        },
      });

      if (!escape) {
        return res.status(404).json({ success: false, message: 'بلاغ الهروب غير موجود' });
      }

      return res.status(200).json({ success: true, escape });
    } catch (error: any) {
      console.error('Error fetching escape details:', error);
      return res.status(500).json({ success: false, message: 'فشل في جلب تفاصيل البلاغ', error: error.message });
    }
  }

  // PUT / PATCH: Update escape
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const escape = await (prisma as any).workerEscape.findUnique({
        where: { id: escapeId },
        include: {
          homeMaid: true,
          order: true,
          client: true,
        },
      });

      if (!escape) {
        return res.status(404).json({ success: false, message: 'بلاغ الهروب غير موجود' });
      }

      const {
        escapeDate,
        escapeTime,
        escapeType,
        notes,
        reportFile,
        visaFeeStatus,
      } = req.body;

      if (!escapeDate) {
        return res.status(400).json({ success: false, message: 'تاريخ الهروب مطلوب' });
      }

      const targetEscapeDate = new Date(escapeDate);
      // Lock escapeType to prevent breaking order lifecycle and housing statuses
      const targetEscapeType = escape.escapeType;
      const targetReportFile = reportFile !== undefined ? reportFile : escape.reportFile;
      const targetNotes = notes !== undefined ? notes : escape.notes;
      const targetEscapeTime = escapeTime !== undefined ? escapeTime : escape.escapeTime;

      // Recalculate warranty based on arrivalDate and updated escapeDate
      const warrantyCalc = calculateEscapeWarranty(escape.arrivalDate, targetEscapeDate);

      const updatedEscape = await prisma.$transaction(async (tx) => {
        // 1. Update workerEscape
        const updated = await (tx as any).workerEscape.update({
          where: { id: escapeId },
          data: {
            escapeDate: targetEscapeDate,
            escapeTime: targetEscapeTime ? String(targetEscapeTime).trim() : null,
            notes: targetNotes ? String(targetNotes).trim() : null,
            reportFile: targetReportFile ? String(targetReportFile).trim() : null,
            daysSinceArrival: warrantyCalc.daysSinceArrival,
            isWithinWarranty: warrantyCalc.isWithinWarranty,
            ...(visaFeeStatus ? { visaFeeStatus } : {}),
          },
        });

        // 2. If airport escape and has reportFile, synchronize with DeliveryDetails and neworder
        const targetOrderId = escape.orderId;
        if (targetEscapeType === 'airport' && targetReportFile && targetOrderId) {
          const existingDelivery = await tx.deliveryDetails.findFirst({
            where: { newOrderId: Number(targetOrderId) },
          });

          if (existingDelivery) {
            await tx.deliveryDetails.update({
              where: { id: existingDelivery.id },
              data: {
                deliveryFile: targetReportFile,
                deliveryDate: targetEscapeDate,
                deliveryNotes: 'مرفق بلاغ هروب من المطار',
              },
            });
          } else {
            await tx.deliveryDetails.create({
              data: {
                newOrderId: Number(targetOrderId),
                deliveryFile: targetReportFile,
                deliveryDate: targetEscapeDate,
                deliveryNotes: 'مرفق بلاغ هروب من المطار',
                isDelivered: false,
              },
            });
          }

          await tx.neworder.update({
            where: { id: targetOrderId },
            data: {
              bookingstatus: 'مغلق لهروب العاملة من المطار',
              clientBookingStatus: 'closed',
              isContractEnded: true,
            },
          });
        }

        // 3. Keep homemaid booking status aligned
        let homemaidBookingStatus = 'هروب';
        if (targetEscapeType === 'airport') homemaidBookingStatus = 'هروب من المطار';
        else if (targetEscapeType === 'housing') homemaidBookingStatus = 'هروب من السكن';
        else if (targetEscapeType === 'client') homemaidBookingStatus = 'هروب من العميل';

        if (escape.homeMaidId) {
          await tx.homemaid.update({
            where: { id: escape.homeMaidId },
            data: { bookingstatus: homemaidBookingStatus },
          });

          // Worker activity log
          try {
            await tx.logs.create({
              data: {
                homemaidId: escape.homeMaidId,
                Status: 'تعديل بلاغ هروب',
                reason: targetNotes || 'تعديل بيانات بلاغ الهروب',
                Details: `تعديل بلاغ هروب (${homemaidBookingStatus}) - تاريخ الهروب: ${targetEscapeDate.toLocaleDateString('ar-SA')}${targetEscapeTime ? ` الساعة ${targetEscapeTime}` : ''}`,
                userId: String(userInfo.username || userInfo.userId),
              },
            });
          } catch (e) {
            console.error('Error logging worker log:', e);
          }
        }

        return updated;
      });

      // 4. System user logs
      try {
        const workerName = escape.homeMaid?.Name || 'عاملة';
        await (prisma as any).systemUserLogs.create({
          data: {
            userId: Number(userInfo.userId),
            actionType: 'تعديل',
            action: `تعديل بلاغ هروب للعاملة #${escape.homeMaidId} (${workerName})`,
            beneficiary: workerName,
            BeneficiaryId: escape.homeMaidId,
            pageRoute: '/admin/escapes',
            details: `تم تعديل بيانات بلاغ الهروب - نوع الهروب: ${targetEscapeType}، تاريخ الهروب: ${targetEscapeDate.toLocaleDateString('ar-SA')}${targetEscapeTime ? ` الساعة ${targetEscapeTime}` : ''}`,
          },
        });
      } catch (sysErr) {
        console.error('Error logging to systemUserLogs:', sysErr);
      }

      return res.status(200).json({
        success: true,
        message: 'تم تعديل بلاغ الهروب بنجاح',
        escape: updatedEscape,
      });
    } catch (error: any) {
      console.error('Error updating escape:', error);
      return res.status(500).json({ success: false, message: 'فشل في تعديل بلاغ الهروب', error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
