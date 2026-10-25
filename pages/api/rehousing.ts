import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';

function getUserFromReq(req: NextApiRequest) {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return { userId: null, username: 'النظام' };

    let tokenStr: string | null = null;
    const parts = cookieHeader.split(';');
    for (const p of parts) {
      const [k, v] = p.trim().split('=');
      if (k === 'authToken') {
        tokenStr = decodeURIComponent(v);
        break;
      }
    }

    if (tokenStr) {
      const token = jwtDecode(tokenStr) as any;
      return {
        userId: Number(token.id) || null,
        username: token.username || 'غير محدد',
      };
    }
  } catch (error) {
    console.error('Error decoding token in rehousing:', error);
  }

  return { userId: null, username: 'النظام' };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { housedWorkerId, houseentrydate, location_id, notes, departureReasonWas } = req.body;

  if (!housedWorkerId) {
    return res.status(400).json({ error: 'معرف العاملة بالسكن مطلوب' });
  }

  if (!houseentrydate) {
    return res.status(400).json({ error: 'يرجى تحديد تاريخ إعادة التسكين' });
  }

  const userInfo = getUserFromReq(req);

  try {
    const worker = await prisma.housedworker.findUnique({
      where: { id: Number(housedWorkerId) },
      include: {
        Order: true,
        externalHomedmaid: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ error: 'العاملة غير مسجلة في سجلات السكن' });
    }

    const entryDate = new Date(houseentrydate);
    const workerName = worker.externalHomedmaid?.name || worker.Order?.Name || 'عاملة';

    await prisma.$transaction(async (tx) => {
      // 1. Preserve previous details and document the return in HousedWorkerNotes
      if (worker.Details && worker.Details.trim()) {
        try {
          await tx.housedWorkerNotes.create({
            data: {
              housedWorkerId: worker.id,
              notes: `[ملاحظات سابقة قبل إعادة التسكين]: ${worker.Details.trim()}`,
              employee: userInfo.username || 'إدارة السكن',
            },
          });
        } catch (e) {
          console.error('Error preserving old details:', e);
        }
      }

      // Log the rehousing event in notes
      try {
        const returnNote = `[إعادة تسكين بتاريخ ${entryDate.toLocaleDateString('ar-SA')}] سبب التسكين الأساسي: ${worker.Reason || 'غير محدد'} | الإجراء: ${worker.actionTaken || 'غير محدد'}${departureReasonWas ? ` | المغادرة السابقة: ${departureReasonWas}` : ''}${notes ? ` | ملاحظات العودة: ${notes}` : ''}`;
        await tx.housedWorkerNotes.create({
          data: {
            housedWorkerId: worker.id,
            notes: returnNote,
            employee: userInfo.username || 'إدارة السكن',
          },
        });
      } catch (e) {
        console.error('Error logging rehousing note:', e);
      }

      // 2. Update housedworker record: Reason and actionTaken remain completely intact!
      await tx.housedworker.update({
        where: { id: worker.id },
        data: {
          deparatureReason: null,
          deparatureHousingDate: null,
          houseentrydate: entryDate,
          ...(location_id ? { location_id: Number(location_id) } : {}),
          isActive: true,
          Details: notes ? String(notes).trim() : (worker.Details || null),
          deportationData: null,
          medicalDepartureData: null,
          transferSponsorshipData: null,
        } as any,
      });

      // 3. Close any previous active checkins to avoid duplicate active beds
      await tx.checkIn.updateMany({
        where: { housedWorkerId: worker.id, isActive: true },
        data: { isActive: false },
      });

      // 4. Create new active checkin
      await tx.checkIn.create({
        data: {
          housedWorkerId: worker.id,
          CheckDate: entryDate,
          isActive: true,
        },
      });

      // 5. Update homemaid status if this is a standard system worker
      if (worker.homeMaid_id) {
        await tx.homemaid.update({
          where: { id: worker.homeMaid_id },
          data: {
            bookingstatus: 'في السكن',
            isApproved: false,
          },
        });

        // Worker profile log
        await tx.logs.create({
          data: {
            homemaidId: worker.homeMaid_id,
            Status: 'إعادة تسكين',
            reason: worker.Reason || 'إعادة تسكين بالسكن',
            Details: `إعادة تسكين العاملة بالسكن بتاريخ ${entryDate.toLocaleDateString('ar-SA')} - سبب التسكين الأساسي: ${worker.Reason || 'غير محدد'}`,
            userId: String(userInfo.username || userInfo.userId || 'النظام'),
          },
        });
      }

      // 6. System audit log
      if (userInfo.userId) {
        await (tx as any).systemUserLogs.create({
          data: {
            userId: userInfo.userId,
            actionType: 'UPDATE',
            action: `إعادة تسكين العاملة (${workerName}) بالسكن`,
            beneficiary: workerName,
            BeneficiaryId: worker.id,
            pageRoute: '/admin/housing-departures',
            details: `إعادة تسكين العاملة بالسكن بتاريخ ${entryDate.toLocaleDateString('ar-SA')} - سبب التسكين الأساسي: ${worker.Reason || 'غير محدد'}${departureReasonWas ? ` (بعد مغادرة سابقة: ${departureReasonWas})` : ''}`,
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'تمت إعادة تسكين العاملة بالسكن بنجاح',
    });
  } catch (error: any) {
    console.error('Error in rehousing API:', error);
    return res.status(500).json({
      error: error.message || 'حدث خطأ غير متوقع أثناء إعادة التسكين بالسكن',
    });
  }
}
