import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
import { syncTransferFinancialStatement } from 'lib/transferFinancialSync';

function getUserInfoFromReq(req: NextApiRequest): { id: number | null; username: string } {
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
      return {
        id: Number(token.id) || null,
        username: token.username || token.name || 'النظام',
      };
    }
  } catch (e) {
    // Ignore token errors
  }
  return { id: null, username: 'النظام' };
}

async function getValidLogUsername(req: NextApiRequest): Promise<string | null> {
  const userInfo = getUserInfoFromReq(req);
  if (!userInfo.id && (!userInfo.username || userInfo.username === 'النظام')) {
    return null;
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userInfo.id ? [{ id: userInfo.id }] : []),
          ...(userInfo.username && userInfo.username !== 'النظام' ? [{ username: userInfo.username }] : []),
        ],
      },
      select: { username: true },
    });
    return user?.username || (userInfo.username !== 'النظام' ? userInfo.username : null);
  } catch {
    return userInfo.username !== 'النظام' ? userInfo.username : null;
  }
}

function getUserIdFromReq(req: NextApiRequest): number | null {
  return getUserInfoFromReq(req).id;
}

async function resolveClientId(idOrVal: any): Promise<number | null> {
  if (!idOrVal) return null;
  const num = Number(idOrVal);
  if (!isNaN(num) && num > 0) {
    try {
      const byId = await prisma.client.findUnique({ where: { id: num } });
      if (byId) return byId.id;
    } catch {
      // Ignore
    }
  }
  const strVal = String(idOrVal).trim();
  if (strVal) {
    try {
      const byNationalOrPhone = await prisma.client.findFirst({
        where: {
          OR: [
            { nationalId: strVal },
            { phonenumber: strVal },
          ],
        },
      });
      if (byNationalOrPhone) return byNationalOrPhone.id;
    } catch {
      // Ignore
    }
  }
  return !isNaN(num) && num > 0 ? num : null;
}

// مزامنة تكلفة التجربة والدفعات إلى كشف حساب العميل
async function syncTrialFailureToClientAccount({
  transferId,
  clientId,
  clientName,
  workerName,
  contractNumber,
  trialStartDate,
  returnDate,
  trialDays,
  dailyCost,
  totalTrialCost,
  paidAmount,
  isCollectedNow,
}: {
  transferId?: number | null;
  clientId?: number | null;
  clientName?: string;
  workerName?: string;
  contractNumber?: string;
  trialStartDate?: string;
  returnDate?: string;
  trialDays: number;
  dailyCost: number;
  totalTrialCost: number;
  paidAmount: number;
  isCollectedNow: boolean;
}) {
  try {
    let resolvedClientId = clientId ? Number(clientId) : null;
    if (!resolvedClientId && clientName && clientName !== '-' && clientName !== 'غير محدد') {
      const foundClient = await prisma.client.findFirst({
        where: { fullname: clientName },
      });
      if (foundClient) resolvedClientId = foundClient.id;
    }

    if (!resolvedClientId) {
      console.log('Skipping client account statement: No clientId found for', clientName);
      return;
    }

    const effectiveContractNumber = transferId ? `TRF-${transferId}` : (contractNumber || `TRF-1`);

    // 1. البحث عن كشف حساب المعاملة الموحد (TRF-X)
    let statement = await prisma.clientAccountStatement.findFirst({
      where: {
        clientId: resolvedClientId,
        contractNumber: effectiveContractNumber,
      },
      include: {
        entries: true,
      },
      orderBy: { id: 'desc' },
    });

    if (!statement) {
      statement = await prisma.clientAccountStatement.findFirst({
        where: {
          contractNumber: effectiveContractNumber,
        },
        include: {
          entries: true,
        },
        orderBy: { id: 'desc' },
      });
    }

    if (!statement) {
      statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: resolvedClientId,
          contractNumber: effectiveContractNumber,
          officeName: 'معاملات نقل الكفالة',
          contractStatus: 'فشلت التجربة',
          notes: `معاملة نقل كفالة #${transferId || ''} - العاملة: ${workerName || 'غير محدد'} (فشلت التجربة وتم إرجاعها للسكن)`,
          totalRevenue: totalTrialCost,
          totalExpenses: 0,
          netAmount: paidAmount > 0 ? paidAmount : (isCollectedNow ? totalTrialCost : 0),
        },
        include: {
          entries: true,
        },
      });
    }

    const today = new Date();
    const retDateObj = returnDate ? new Date(returnDate) : today;
    const startDateObj = trialStartDate ? new Date(trialStartDate) : today;
    const existingEntries: any[] = statement.entries || [];

    // جلب التكلفة الأصلية للمعاملة إذا كانت مسجلة
    let originalCost = 0;
    if (transferId) {
      const trf = await prisma.transferSponsorShips.findUnique({
        where: { id: Number(transferId) },
      });
      if (trf && trf.Cost) originalCost = Number(trf.Cost);
    }

    // 2. قيد الدفعة / العربون المسبق (إذا لم يكن مسجلاً من قبل في الكشف)
    const hasAdvanceEntry = existingEntries.some(
      (e: any) => e.description?.includes('عربون') || e.description?.includes('دفعة') || e.entryType === 'payment' || e.entryType === 'عربون تجربة'
    );
    if (paidAmount > 0 && !hasAdvanceEntry) {
      await prisma.clientAccountEntry.create({
        data: {
          statementId: statement.id,
          date: startDateObj,
          description: `دفعة / عربون فترة التجربة`,
          debit: 0,
          credit: paidAmount,
          balance: 0,
          entryType: 'payment',
          displayOrder: 2,
        },
      });
    }

    // 3. قيد استحقاق تكلفة أيام التجربة الفعلية فقط (مدين على العميل - لنا)
    const hasTrialCostEntry = existingEntries.some(
      (e: any) => e.description?.includes('تكلفة فترة تجربة') || e.entryType === 'trial_cost' || e.entryType === 'تكلفة فترة التجربة'
    );
    if (totalTrialCost > 0 && !hasTrialCostEntry) {
      await prisma.clientAccountEntry.create({
        data: {
          statementId: statement.id,
          date: retDateObj,
          description: `تكلفة فترة تجربة العاملة (${workerName || ''}) - (${trialDays} يوم × ${dailyCost} ر.س/يوم)`,
          debit: totalTrialCost,
          credit: 0,
          balance: 0,
          entryType: 'trial_cost',
          displayOrder: 3,
        },
      });
    }

    // 4. في حال كانت الدفعة المسبقة أكبر من تكلفة التجربة، قيد إرجاع/استرداد المتبقي للعميل (مدين - له)
    const refundAmount = Math.max(0, paidAmount - totalTrialCost);
    if (refundAmount > 0) {
      const hasRefundEntry = existingEntries.some(
        (e: any) => e.entryType === 'refund' || e.description?.includes('إرجاع متبقي دفعة التجربة')
      );
      if (!hasRefundEntry) {
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: retDateObj,
            description: `إرجاع متبقي دفعة التجربة للعميل بعد خصم تكلفة التجربة`,
            debit: refundAmount,
            credit: 0,
            balance: 0,
            entryType: 'refund',
            displayOrder: 4,
          },
        });
      }
    }

    // 5. في حال تحصيل المبلغ أو المتبقي منه نقداً عند الإرجاع
    const remainingToCollect = Math.max(0, totalTrialCost - paidAmount);
    if (isCollectedNow && remainingToCollect > 0) {
      const hasCollectedEntry = existingEntries.some(
        (e: any) => e.description?.includes('سداد وتحصيل') || e.entryType === 'payment_collected'
      );
      if (!hasCollectedEntry) {
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: retDateObj,
            description: paidAmount > 0 
              ? `سداد وتحصيل متبقي تكلفة فترة التجربة نقداً / عند الإرجاع (${remainingToCollect} ر.س)`
              : `سداد وتحصيل تكلفة فترة التجربة نقداً / عند الإرجاع`,
            debit: 0,
            credit: remainingToCollect,
            balance: 0,
            entryType: 'payment',
            displayOrder: 5,
          },
        });
      }
    }

    // 6. إلغاء فاتورة عقد نقل الكفالة الكاملة بسبب فشل التجربة وإرجاع العاملة للسكن (دائن - له)
    const invoiceEntry = existingEntries.find(
      (e: any) => (e.entryType === 'invoice' || e.description?.includes('فاتورة عقد')) && Number(e.debit) > 0
    );
    const invoiceVal = invoiceEntry ? Number(invoiceEntry.debit) : originalCost;
    const hasReversal = existingEntries.some(
      (e: any) => e.description?.includes('إلغاء فاتورة عقد') || e.entryType === 'cancellation'
    );

    if (invoiceVal > 0 && !hasReversal) {
      await prisma.clientAccountEntry.create({
        data: {
          statementId: statement.id,
          date: retDateObj,
          description: `إلغاء فاتورة عقد نقل الكفالة بسبب فشل التجربة وإرجاع العاملة للسكن`,
          debit: 0,
          credit: invoiceVal,
          balance: 0,
          entryType: 'cancellation',
          displayOrder: 6,
        },
      });
    }

    // 7. تحديث إجماليات كشف الحساب والرصيد التراكمي لجميع القيود
    const allUpdatedEntries = await prisma.clientAccountEntry.findMany({
      where: { statementId: statement.id },
      orderBy: [{ date: 'asc' }, { displayOrder: 'asc' }, { id: 'asc' }],
    });

    let runningBalance = 0;
    for (const entry of allUpdatedEntries) {
      const deb = Number(entry.debit) || 0;
      const cred = Number(entry.credit) || 0;
      runningBalance = runningBalance + deb - cred;

      await prisma.clientAccountEntry.update({
        where: { id: entry.id },
        data: { balance: runningBalance },
      });
    }

    await prisma.clientAccountStatement.update({
      where: { id: statement.id },
      data: {
        totalRevenue: totalTrialCost,
        totalExpenses: 0,
        netAmount: paidAmount > 0 ? paidAmount : (isCollectedNow ? totalTrialCost : 0),
        contractStatus: 'فشلت التجربة',
        notes: `معاملة نقل كفالة #${transferId || ''} - العاملة: ${workerName || ''} (فشلت التجربة وتم إرجاعها للسكن)`,
      },
    });

    console.log(`✅ تم تحديث كشف حساب العميل #${resolvedClientId} بنجاح لكشف ${effectiveContractNumber}`);
  } catch (accErr) {
    console.error('Error syncing trial failure to client account:', accErr);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    // استرجاع قائمة معاملات نقل الكفالة أو معاملة محددة
case 'GET':
      try {
        const {
          id,
          page = '1',
          limit = '10',
          tab = 'trials', // 'trials' | 'completed' | 'all'
          nationalityFilter,
          cityFilter,
          dateFrom,
          dateTo,
          statusFilter,
          stageFilter,
          searchTerm,
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // إذا كان في id → جلب معاملة واحدة (بدون pagination)
        if (id) {
          const transfer = await prisma.transferSponsorShips.findUnique({
            where: { id: Number(id) },
            include: {
              HomeMaid: { select: { id: true, Name: true, Passportnumber: true, Nationalitycopy: true } },
              NewClient: { select: { id: true, fullname: true, phonenumber: true, nationalId: true, city: true, alternativePhone: true, dateofbirth: true } },
              OldClient: { select: { id: true, fullname: true, phonenumber: true, nationalId: true, city: true, alternativePhone: true } },
            },
          });

          if (!transfer) {
            return res.status(404).json({ error: 'معاملة نقل الكفالة غير موجودة' });
          }

          // تنظيف الملاحظات القديمة إذا كانت بصيغة JSON القديمة واستخراج الحقول المفيدة
          let cleanNotes = transfer.Notes;
          let parsedLegacy: any = null;
          if (cleanNotes && typeof cleanNotes === 'string' && cleanNotes.trim().startsWith('{') && cleanNotes.trim().endsWith('}')) {
            try {
              const p = JSON.parse(cleanNotes);
              if (p && typeof p === 'object' && ('newSponsorDateOfBirth' in p || 'medicalCheckValid' in p || 'sponsorHasViolations' in p)) {
                cleanNotes = p.notes || p.Notes || p.note || null;
                parsedLegacy = p;
              }
            } catch {}
          }

          const responseObj: any = { ...transfer, Notes: cleanNotes };
          if (parsedLegacy?.trialDailyCost && !transfer.dailyCost) {
            responseObj.dailyCost = Number(parsedLegacy.trialDailyCost);
          }
          if (parsedLegacy?.newSponsorDateOfBirth && !transfer.NewClient?.dateofbirth && responseObj.NewClient) {
            responseObj.NewClient = {
              ...responseObj.NewClient,
              dateofbirth: parsedLegacy.newSponsorDateOfBirth,
            };
          }

          return res.status(200).json(responseObj);
        }

        // بناء الفلاتر
        const where: any = {};
        const andConditions: any[] = [];

        // تصفية حسب التبويب (Tabs)
        if (tab === 'trials') {
          andConditions.push({
            OR: [
              { transferStage: { in: ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'] } },
              {
                AND: [
                  { ExperimentStart: { not: null } },
                  { transferStage: { notIn: ['تم نقل الكفالة', 'نقل الخدمات', 'فشلت التجربة'] } },
                ],
              },
            ],
            NOT: { transferStage: 'فشلت التجربة' },
            AND: [
              {
                OR: [
                  { ExperimentRate: null },
                  { ExperimentRate: { not: 'فاشلة' } },
                ],
              },
            ],
          });
        } else if (tab === 'completed') {
          andConditions.push({
            OR: [
              { transferStage: { in: ['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'] } },
              { ExperimentRate: 'ناجحة' },
            ],
          });
        } else if (tab === 'failed') {
          andConditions.push({
            OR: [
              { transferStage: { in: ['فشلت التجربة'] } },
              { ExperimentRate: 'فاشلة' },
            ],
          });
        }
        // tab === 'all' لا يضيف قيد على المرحلة

        if (nationalityFilter) {
          andConditions.push({
            HomeMaid: {
              Nationalitycopy: { contains: nationalityFilter as string },
            },
          });
        }

        if (cityFilter) {
          andConditions.push({
            OR: [
              { NewClient: { city: { contains: cityFilter as string } } },
              { OldClient: { city: { contains: cityFilter as string } } },
            ],
          });
        }

        if (dateFrom || dateTo) {
          const dateCond: any = {};
          if (dateFrom) dateCond.gte = new Date(dateFrom as string);
          if (dateTo) {
            const end = new Date(dateTo as string);
            end.setHours(23, 59, 59, 999);
            dateCond.lte = end;
          }
          andConditions.push({
            createdAt: dateCond,
          });
        }

        if (statusFilter) {
          andConditions.push({ ExperimentRate: statusFilter as string });
        }
        if (stageFilter) {
          andConditions.push({ transferStage: stageFilter as string });
        }

        if (searchTerm) {
          const trimmedTerm = String(searchTerm).trim();
          const isNum = !isNaN(Number(trimmedTerm)) && /^\d+$/.test(trimmedTerm);
          andConditions.push({
            OR: [
              ...(isNum ? [{ id: Number(trimmedTerm) }] : []),
              { TransferOperationNumber: { contains: trimmedTerm } },
              { NewClient: { fullname: { contains: trimmedTerm } } },
              { NewClient: { nationalId: { contains: trimmedTerm } } },
              { OldClient: { fullname: { contains: trimmedTerm } } },
              { OldClient: { nationalId: { contains: trimmedTerm } } },
              { HomeMaid: { Name: { contains: trimmedTerm } } },
              { HomeMaid: { Passportnumber: { contains: trimmedTerm } } },
              { NationalID: { contains: trimmedTerm } },
            ],
          });
        }

        if (andConditions.length > 0) {
          where.AND = andConditions;
        }

        // جلب البيانات مع Pagination وحساب الأعداد للتبويبات
        const transfers = await prisma.transferSponsorShips.findMany({
          where,
          include: {
            HomeMaid: { select: { id: true, Name: true, Passportnumber: true, Nationalitycopy: true } },
            NewClient: { select: { id: true, fullname: true, phonenumber: true, nationalId: true, city: true, alternativePhone: true, dateofbirth: true } },
            OldClient: { select: { id: true, fullname: true, phonenumber: true, nationalId: true, city: true, alternativePhone: true } },
          },
          orderBy: { id: 'desc' },
          skip,
          take: limitNum,
        });

        const total = await prisma.transferSponsorShips.count({ where });

        // حساب أعداد التبويبات بكفاءة عالية وبدون استهلاك اتصالات إضافية
        const allTransfersSummary = await prisma.transferSponsorShips.findMany({
          select: {
            id: true,
            transferStage: true,
            ExperimentRate: true,
            ExperimentStart: true,
          },
        });

        let trialsCount = 0;
        let completedCount = 0;
        let failedCount = 0;

        for (const t of allTransfersSummary) {
          const stage = t.transferStage || '';
          const rate = t.ExperimentRate || '';
          if (stage === 'فشلت التجربة' || rate === 'فاشلة') {
            failedCount++;
          } else if (['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'].includes(stage) || rate === 'ناجحة') {
            completedCount++;
          } else if (
            ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'].includes(stage) ||
            (t.ExperimentStart && !['تم نقل الكفالة', 'نقل الخدمات', 'فشلت التجربة'].includes(stage))
          ) {
            trialsCount++;
          }
        }
        const allCount = allTransfersSummary.length;

        const totalPages = Math.ceil(total / limitNum);

        const sanitizedTransfers = transfers.map((t) => {
          let cleanNotes = t.Notes;
          if (cleanNotes && typeof cleanNotes === 'string' && cleanNotes.trim().startsWith('{') && cleanNotes.trim().endsWith('}')) {
            try {
              const p = JSON.parse(cleanNotes);
              if (p && typeof p === 'object' && ('newSponsorDateOfBirth' in p || 'medicalCheckValid' in p)) {
                cleanNotes = p.notes || p.Notes || p.note || null;
              }
            } catch {}
          }
          return { ...t, Notes: cleanNotes };
        });

        return res.status(200).json({
          transfers: sanitizedTransfers,
          tabCounts: {
            trials: trialsCount,
            completed: completedCount,
            failed: failedCount,
            all: allCount,
          },
          pagination: {
            total,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        });
      } catch (error: any) {
        console.error('خطأ في استرجاع معاملات نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر', details: error?.message || String(error) });
      }
    // إنشاء معاملة نقل كفالة جديدة أو تنفيذ إجراء خاص
    case 'POST':
      try {
        const { action } = req.body;

        // 🛑 مسار إنهاء التجربة كـ (فاشلة) وإرجاع العاملة للسكن والتسوية المحاسبية
        if (action === 'fail_trial_return_housing') {
          const {
            transferId,
            housedWorkerId,
            clientId,
            clientName,
            workerName,
            failReason,
            trialStartDate,
            returnDate,
            trialDays,
            dailyCost,
            totalTrialCost,
            paidAmount,
            isCollectedNow,
            notes,
          } = req.body;
          const retDate = returnDate ? new Date(returnDate) : new Date();
          const retDateStr = retDate.toISOString().split('T')[0];

          let transfer: any = null;
          if (transferId) {
            transfer = await prisma.transferSponsorShips.findUnique({
              where: { id: Number(transferId) },
              include: { HomeMaid: true, NewClient: true, OldClient: true },
            });
          }

          let hwRecord: any = null;
          if (housedWorkerId) {
            hwRecord = await prisma.housedworker.findUnique({
              where: { id: Number(housedWorkerId) },
              include: { Order: true, externalHomedmaid: true },
            });
          }

          // إذا لم يتم العثور على المعاملة عبر transferId، نحاول العثور عليها عبر housedWorker
          if (!transfer && hwRecord) {
            const maidId = hwRecord.homeMaid_id || hwRecord.externalHomedmaidId;
            const tsd = hwRecord.transferSponsorshipData as any;
            if (tsd?.id) {
              transfer = await prisma.transferSponsorShips.findUnique({
                where: { id: Number(tsd.id) },
                include: { HomeMaid: true, NewClient: true, OldClient: true },
              });
            } else if (maidId) {
              transfer = await prisma.transferSponsorShips.findFirst({
                where: {
                  HomeMaidId: maidId,
                  transferStage: { in: ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة', 'انشاء العقد', 'انشاء الطلب'] },
                },
                orderBy: { id: 'desc' },
                include: { HomeMaid: true, NewClient: true, OldClient: true },
              });
            }
          }

          const startDateStr =
            trialStartDate ||
            (transfer?.ExperimentStart
              ? new Date(transfer.ExperimentStart).toISOString().split('T')[0]
              : '');

          const numTrialDays = Number(trialDays) || 0;
          const numDailyCost = Number(dailyCost) || 0;
          const numTotalCost = Number(totalTrialCost) || numTrialDays * numDailyCost;
          const numPaid = Number(paidAmount) || 0;
          const collected = Boolean(isCollectedNow);

          const settlementText = [
            `📊 [التسوية المحاسبية وكشف حساب العميل]:`,
            startDateStr
              ? `- فترة التجربة: من ${startDateStr} إلى ${retDateStr} (${numTrialDays} يوم)`
              : `- مدة التجربة: ${numTrialDays} يوم (حتى ${retDateStr})`,
            `- الأجرة اليومية: ${numDailyCost.toLocaleString('en-US')} ر.س`,
            `- إجمالي تكلفة التجربة: ${numTotalCost.toLocaleString('en-US')} ر.س`,
            numPaid > 0
              ? `- المدفوع مسبقاً: ${numPaid.toLocaleString('en-US')} ر.س (المتبقي للعميل بعد خصم التجربة: ${Math.max(0, numPaid - numTotalCost).toLocaleString('en-US')} ر.س)`
              : collected
              ? `- لم يدفع عربوناً مسبقاً، وتم تحصيل وسداد المبلغ بالكامل (${numTotalCost.toLocaleString('en-US')} ر.س) عند الإرجاع.`
              : `- لم يدفع العميل عربوناً، وتم قيد المبلغ (${numTotalCost.toLocaleString('en-US')} ر.س) كمديونية على العميل في كشف الحساب.`,
          ].join('\n');

          const failureNotes = [
            notes ? String(notes).trim() : '',
            failReason ? `سبب فشل التجربة: ${failReason}` : '',
            settlementText,
          ]
            .filter(Boolean)
            .join('\n\n');

          let updatedTransfer: any = null;
          if (transfer) {
            updatedTransfer = await prisma.transferSponsorShips.update({
              where: { id: transfer.id },
              data: {
                transferStage: 'فشلت التجربة',
                ExperimentRate: 'فاشلة',
                ExperimentStart: startDateStr ? new Date(startDateStr) : undefined,
                ExperimentEnd: retDate,
                ExperimentDuration: numTrialDays ? `${numTrialDays} يوم` : undefined,
                dailyCost: numDailyCost ? numDailyCost : undefined,
                Paid: numPaid,
                remainingCost: numPaid === 0 && !collected ? numTotalCost : 0,
                Notes: transfer.Notes ? `${transfer.Notes}\n\n${failureNotes}` : failureNotes,
              },
              include: {
                HomeMaid: { select: { id: true, Name: true, Passportnumber: true, Nationalitycopy: true } },
                NewClient: { select: { id: true, fullname: true, phonenumber: true, city: true } },
                OldClient: { select: { id: true, fullname: true, phonenumber: true, city: true } },
              },
            });
          }

          // مزامنة الحساب وتسجيل القيود تلقائياً في كشف حساب العميل
          const targetClientId = clientId || transfer?.NewClientId || transfer?.ClientId;
          const targetClientName = clientName || transfer?.NewClient?.fullname;
          const targetWorkerName = workerName || transfer?.HomeMaid?.Name || hwRecord?.Order?.Name || hwRecord?.externalHomedmaid?.name;

          await syncTrialFailureToClientAccount({
            transferId: transfer?.id || (transferId ? Number(transferId) : null),
            clientId: targetClientId,
            clientName: targetClientName,
            workerName: targetWorkerName,
            contractNumber: transfer?.id ? `TRF-${transfer.id}` : undefined,
            trialStartDate: startDateStr,
            returnDate: retDateStr,
            trialDays: numTrialDays,
            dailyCost: numDailyCost,
            totalTrialCost: numTotalCost,
            paidAmount: numPaid,
            isCollectedNow: collected,
          });

          // تحديث العاملة في جدول homemaid
          const targetHomeMaidId = transfer?.HomeMaidId || hwRecord?.homeMaid_id || hwRecord?.externalHomedmaidId;
          if (targetHomeMaidId) {
            try {
              await prisma.homemaid.update({
                where: { id: targetHomeMaidId },
                data: {
                  bookingstatus: 'في السكن',
                  isApproved: true,
                },
              });
            } catch (maidErr) {
              console.error('Error updating homemaid on trial fail:', maidErr);
            }
          }

          // تحديث السكن housedworker
          try {
            const targetHw = hwRecord || (targetHomeMaidId ? await prisma.housedworker.findFirst({
              where: {
                OR: [
                  { homeMaid_id: targetHomeMaidId },
                  { externalHomedmaidId: targetHomeMaidId },
                ],
              },
              orderBy: { id: 'desc' },
            }) : null);

            if (targetHw) {
              const existingTsd = (targetHw.transferSponsorshipData as any) || {};
              const updatedTsd = {
                ...existingTsd,
                failReason,
                trialStartDate: startDateStr || existingTsd.trialStartDate,
                trialEndDate: retDateStr,
                trialDays: numTrialDays || existingTsd.trialDays,
                dailyCost: numDailyCost || existingTsd.dailyCost,
                totalTrialCost: numTotalCost || existingTsd.totalTrialCost,
                paidAmount: numPaid || existingTsd.paidAmount,
                isCollectedNow: collected,
                isFailedTrial: true,
              };

              await prisma.housedworker.update({
                where: { id: targetHw.id },
                data: {
                  deparatureHousingDate: null,
                  deparatureReason: null,
                  houseentrydate: retDate,
                  transferSponsorshipData: updatedTsd as any,
                } as any,
              });

              const userInfo = getUserInfoFromReq(req);
              const maidDisplayName = transfer?.HomeMaid?.Name || targetHw.Order?.Name || targetHw.externalHomedmaid?.name || '';
              await prisma.housedWorkerNotes.create({
                data: {
                  housedWorkerId: targetHw.id,
                  employee: userInfo.username || 'النظام',
                  notes: `[إرجاع للسكن - فشل تجربة نقل الخدمات]\nتم إرجاع العاملة (${maidDisplayName}) إلى السكن بتاريخ ${retDateStr} بسبب: ${failReason || 'فشل التجربة'}.\n\n${settlementText}${notes ? `\n\nالملاحظات الإضافية: ${notes}` : ''}`,
                },
              });
            }

            // إذا كان سبب الفشل هو الهروب، يتم التوثيق التلقائي في جدول الهروب
            if (String(failReason || '').includes('هروب') && targetHomeMaidId) {
              try {
                const tId = Number(targetHomeMaidId);
                const arr = await prisma.arrivallist.findFirst({
                  where: {
                    OR: [
                      { HomemaIdnumber: tId },
                      { Order: { HomemaidId: tId } },
                      { Order: { HomemaidIdCopy: tId } },
                    ],
                    KingdomentryDate: { not: null },
                  },
                  orderBy: { id: 'desc' },
                  select: { KingdomentryDate: true },
                });

                let arrivalDate = arr?.KingdomentryDate ? new Date(arr.KingdomentryDate) : null;
                if (!arrivalDate) {
                  const ticket = await prisma.tickets_details.findFirst({
                    where: {
                      OR: [
                        { order: { HomemaidId: tId } },
                        { order: { HomemaidIdCopy: tId } },
                      ],
                      arrival_date: { not: null },
                    },
                    orderBy: { id: 'desc' },
                    select: { arrival_date: true },
                  });
                  if (ticket?.arrival_date) {
                    arrivalDate = new Date(ticket.arrival_date);
                  }
                }
                let daysSinceArrival: number | null = null;
                let isWithinWarranty = false;
                if (arrivalDate) {
                  const startDay = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate()).getTime();
                  const escapeDay = new Date(retDate.getFullYear(), retDate.getMonth(), retDate.getDate()).getTime();
                  daysSinceArrival = Math.max(0, Math.round((escapeDay - startDay) / (1000 * 60 * 60 * 24)));
                  isWithinWarranty = daysSinceArrival <= 90;
                }

                const uId = getUserIdFromReq(req);
                await (prisma as any).workerEscape.create({
                  data: {
                    escapeType: 'trial_transfer',
                    homeMaidId: Number(targetHomeMaidId),
                    clientId: targetClientId ? Number(targetClientId) : null,
                    transferId: transfer?.id ? Number(transfer.id) : null,
                    escapeDate: retDate,
                    arrivalDate,
                    daysSinceArrival,
                    isWithinWarranty,
                    visaFeeRequired: false,
                    visaFeeAmount: 0,
                    visaFeeStatus: 'none',
                    workerWageAmount: numTotalCost,
                    trialDaysCount: numTrialDays,
                    notes: `هروب أثناء تجربة نقل الكفالة - أجرة مستحقة: ${numTotalCost} ر.س عن ${numTrialDays} يوم. ${notes || ''}`,
                    createdById: uId ? Number(uId) : null,
                  },
                });
              } catch (escErr) {
                console.error('Error creating worker escape log from trial transfer:', escErr);
              }
            }
          } catch (hwErr) {
            console.error('Error updating housedworker on trial fail:', hwErr);
          }

          // تسجيل في سجلات النظام
          const userId = getUserIdFromReq(req);
          if (userId) {
            const workerNameForLog = transfer?.HomeMaid?.Name || hwRecord?.Order?.Name || hwRecord?.externalHomedmaid?.name || '';
            eventBus.emit('ACTION', {
              type: `تسجيل فشل تجربة نقل خدمات ${transfer ? `#${transfer.id}` : ''} وإرجاع العاملة (${workerNameForLog}) للسكن`,
              actionType: 'update',
              userId: userId,
            });
          }

          return res.status(200).json(updatedTransfer || { success: true, message: 'تم إرجاع العاملة للسكن بنجاح' });
        }

        // 🌟 مسار إتمام نقل الكفالة وتأكيد نجاح التجربة
        if (action === 'complete_transfer') {
          const {
            transferId,
            completionDate,
            contractDate,
            cost,
            paid,
            remainingCost,
            transferOpNum,
            notes,
            salaryCertificateFile,
            nationalAddressFile,
            paymentReceiptFile,
            promissoryNoteFile,
          } = req.body;

          const transfer = await prisma.transferSponsorShips.findUnique({
            where: { id: Number(transferId) },
            include: { HomeMaid: true, NewClient: true, OldClient: true },
          });

          if (!transfer) {
            return res.status(404).json({ error: 'معاملة نقل الكفالة غير موجودة' });
          }

          const compDate = completionDate ? new Date(completionDate) : new Date();
          const updatedTransfer = await prisma.transferSponsorShips.update({
            where: { id: transfer.id },
            data: {
              transferStage: 'تم نقل الكفالة',
              ExperimentRate: 'ناجحة',
              TransferingDate: compDate.toISOString().split('T')[0],
              ContractDate: contractDate ? new Date(contractDate) : new Date(),
              TransferOperationNumber: transferOpNum || transfer.TransferOperationNumber,
              Cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : transfer.Cost,
              Paid: paid !== undefined ? (paid ? parseFloat(paid) : null) : transfer.Paid,
              remainingCost: remainingCost !== undefined 
                ? (remainingCost ? parseFloat(remainingCost) : null) 
                : ((cost !== undefined || paid !== undefined) 
                    ? Math.max(0, Number(cost !== undefined ? cost : transfer.Cost || 0) - Number(paid !== undefined ? paid : transfer.Paid || 0)) 
                    : transfer.remainingCost),
              salaryCertificateFile: salaryCertificateFile !== undefined ? salaryCertificateFile : transfer.salaryCertificateFile,
              nationalAddressFile: nationalAddressFile !== undefined ? nationalAddressFile : transfer.nationalAddressFile,
              paymentReceiptFile: paymentReceiptFile !== undefined ? paymentReceiptFile : transfer.paymentReceiptFile,
              promissoryNoteFile: promissoryNoteFile !== undefined ? promissoryNoteFile : transfer.promissoryNoteFile,
              Notes: notes ? (transfer.Notes ? `${transfer.Notes}\n${notes}` : notes) : transfer.Notes,
            } as any,
            include: {
              HomeMaid: { select: { id: true, Name: true, Passportnumber: true, Nationalitycopy: true } },
              NewClient: { select: { id: true, fullname: true, phonenumber: true, city: true } },
              OldClient: { select: { id: true, fullname: true, phonenumber: true, city: true } },
            },
          });

          // تحديث العاملة والسكن
          if (transfer.HomeMaidId) {
            try {
              await prisma.homemaid.update({
                where: { id: transfer.HomeMaidId },
                data: {
                  bookingstatus: 'تم نقل الكفالة',
                  isApproved: false,
                },
              });
            } catch (maidErr) {
              console.error('Error updating homemaid on transfer complete:', maidErr);
            }

            try {
              const hw = await prisma.housedworker.findFirst({
                where: {
                  OR: [
                    { homeMaid_id: transfer.HomeMaidId },
                    { externalHomedmaidId: transfer.HomeMaidId },
                  ],
                },
                orderBy: { id: 'desc' },
              });

              if (hw) {
                await prisma.housedworker.update({
                  where: { id: hw.id },
                  data: {
                    deparatureReason: 'تم نقل الكفالة',
                  } as any,
                });

                const userInfo = getUserInfoFromReq(req);
                await prisma.housedWorkerNotes.create({
                  data: {
                    housedWorkerId: hw.id,
                    employee: userInfo.username || 'النظام',
                    notes: `[إتمام نقل الكفالة بنجاح]\nتم تأكيد نجاح فترة التجربة ونقل كفالة العاملة (${transfer.HomeMaid?.Name || ''}) رسمياً للكفيل (${transfer.NewClient?.fullname || ''}) بتاريخ ${compDate.toISOString().split('T')[0]}.`,
                  },
                });
              }
            } catch (hwErr) {
              console.error('Error updating housedworker on transfer complete:', hwErr);
            }
          }

          // تسجيل في سجل عمليات العاملة (logs) وسجلات النظام
          const logUsername = await getValidLogUsername(req);
          if (transfer.HomeMaidId) {
            try {
              await prisma.logs.create({
                data: {
                  homemaidId: Number(transfer.HomeMaidId),
                  Details: `إتمام نقل كفالة معاملة #${transfer.id} للعاملة (${transfer.HomeMaid?.Name || ''}) للكفيل (${transfer.NewClient?.fullname || ''})`,
                  reason: "نقل كفالة",
                  Status: "تم نقل الكفالة",
                  userId: logUsername,
                },
              });
            } catch (logErr) {
              console.error('Error creating homemaid log on transfer complete:', logErr);
            }
          }

          const userId = getUserIdFromReq(req);
          if (userId) {
            eventBus.emit('ACTION', {
              type: `إتمام نقل كفالة معاملة #${transfer.id} للعاملة (${transfer.HomeMaid?.Name || ''}) للكفيل (${transfer.NewClient?.fullname || ''})`,
              actionType: 'update',
              userId: userId,
            });
          }

          // مزامنة وتحديث كشف الحساب المالي والقيود
          try {
            await syncTransferFinancialStatement(transfer.id);
          } catch (syncErr) {
            console.error('Error syncing transfer financial statement on complete:', syncErr);
          }

          return res.status(200).json(updatedTransfer);
        }

        const {
          HomeMaidId,
          NewClientId,
          OldClientId,
          Cost,
          Paid,
          dailyCost,
          remainingCost,
          salaryCertificateFile,
          nationalAddressFile,
          paymentReceiptFile,
          promissoryNoteFile,
          ExperimentStart,
          ExperimentEnd,
          ContractDate,
          ExperimentRate,
          Notes,
          NationalID,
          transferStage,
          ExperimentDuration,
          WorkDuration,
          EntryDate,
          TransferingDate,
          file,
          TransferOperationNumber,
          NewClientAltPhone,
          NewClientDateOfBirth,
        } = req.body;

        const resolvedNewClientId = await resolveClientId(NewClientId);
        const resolvedOldClientId = await resolveClientId(OldClientId);

        // تحديث بيانات العميل الجديد إذا أُرسلت
        if (resolvedNewClientId && (NewClientAltPhone || NewClientDateOfBirth || NationalID)) {
          try {
            await prisma.client.update({
              where: { id: resolvedNewClientId },
              data: {
                ...(NewClientAltPhone ? { alternativePhone: NewClientAltPhone } : {}),
                ...(NewClientDateOfBirth ? { dateofbirth: new Date(NewClientDateOfBirth) } : {}),
              },
            });
          } catch (e) {
            console.error('Error updating NewClient in POST:', e);
          }
        }

        // التحقق من الحقول المطلوبة
        if (!HomeMaidId || !resolvedNewClientId || !resolvedOldClientId) {
          return res.status(400).json({ error: 'معرف العاملة، الكفيل الجديد، والكفيل السابق مطلوبين للطلب' });
        }

        let effectiveStage = transferStage;
        let effectiveRate = ExperimentRate;
        if (effectiveRate === 'فاشلة') {
          effectiveStage = 'فشلت التجربة';
        } else if (effectiveStage === 'فشلت التجربة' && !effectiveRate) {
          effectiveRate = 'فاشلة';
        }

        const existingTransfer = await prisma.transferSponsorShips.findFirst({
          where: {
            HomeMaidId: Number(HomeMaidId),
          },
        });

        let transfer: any;
        if (existingTransfer) {
          transfer = await prisma.transferSponsorShips.update({
            where: { id: existingTransfer.id },
            data: {
              NewClientId: resolvedNewClientId,
              OldClientId: resolvedOldClientId,
              Cost: Cost ? parseFloat(Cost) : undefined,
              Paid: Paid ? parseFloat(Paid) : undefined,
              dailyCost: dailyCost !== undefined ? (dailyCost ? parseFloat(dailyCost) : null) : undefined,
              remainingCost: remainingCost !== undefined ? (remainingCost ? parseFloat(remainingCost) : null) : undefined,
              salaryCertificateFile: salaryCertificateFile !== undefined ? salaryCertificateFile : undefined,
              nationalAddressFile: nationalAddressFile !== undefined ? nationalAddressFile : undefined,
              paymentReceiptFile: paymentReceiptFile !== undefined ? paymentReceiptFile : undefined,
              promissoryNoteFile: promissoryNoteFile !== undefined ? promissoryNoteFile : undefined,
              ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : undefined,
              ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : undefined,
              ExperimentRate: effectiveRate,
              Notes,
              TransferOperationNumber: TransferOperationNumber ? TransferOperationNumber : null,
              ContractDate: ContractDate ? new Date(ContractDate) : undefined,
              EntryDate: EntryDate ? new Date(EntryDate) : undefined,
              ExperimentDuration: ExperimentDuration ? ExperimentDuration : undefined,
              WorkDuration,
              transferStage: effectiveStage,
              NationalID,
              TransferingDate,
              file,
            } as any,
            include: {
              HomeMaid: { select: { Name: true, Passportnumber: true } },
              NewClient: { select: { fullname: true, city: true, phonenumber: true, alternativePhone: true, dateofbirth: true } },
              OldClient: { select: { fullname: true, city: true, phonenumber: true } },
            },
          });
        } else {
          transfer = await prisma.transferSponsorShips.create({
            data: {
              HomeMaidId: Number(HomeMaidId),
              NewClientId: resolvedNewClientId,
              OldClientId: resolvedOldClientId,
              Cost: Cost ? parseFloat(Cost) : null,
              Paid: Paid ? parseFloat(Paid) : null,
              dailyCost: dailyCost ? parseFloat(dailyCost) : null,
              remainingCost: remainingCost !== undefined 
                ? (remainingCost ? parseFloat(remainingCost) : null) 
                : (Cost ? Math.max(0, parseFloat(Cost) - (parseFloat(Paid) || 0)) : null),
              salaryCertificateFile: salaryCertificateFile || null,
              nationalAddressFile: nationalAddressFile || null,
              paymentReceiptFile: paymentReceiptFile || null,
              promissoryNoteFile: promissoryNoteFile || null,
              ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : null,
              ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : null,
              ExperimentRate: effectiveRate,
              Notes,
              TransferOperationNumber: TransferOperationNumber ? TransferOperationNumber : null,
              ContractDate: ContractDate ? new Date(ContractDate) : null,
              EntryDate: EntryDate ? new Date(EntryDate) : null,
              ExperimentDuration: ExperimentDuration ? ExperimentDuration : null,
              WorkDuration,
              transferStage: effectiveStage,
              NationalID,
              TransferingDate,
              file,
            } as any,
            include: {
              HomeMaid: { select: { Name: true, Passportnumber: true } },
              NewClient: { select: { fullname: true, city: true, phonenumber: true, alternativePhone: true, dateofbirth: true } },
              OldClient: { select: { fullname: true, city: true, phonenumber: true } },
            },
          });
        }

        // تسجيل في سجل عمليات العاملة
        const logUsername = await getValidLogUsername(req);
        try {
          await prisma.logs.create({
            data: {
              homemaidId: Number(HomeMaidId),
              Details: `توثيق معاملة نقل كفالة للعاملة (${transfer?.HomeMaid?.Name || 'عاملة'}) للكفيل الجديد (${transfer?.NewClient?.fullname || 'غير محدد'}) - إجمالي التكلفة: ${Cost || 0} ر.س، المسدد: ${Paid || 0} ر.س`,
              reason: "نقل كفالة",
              Status: transferStage || "نقل الخدمات",
              userId: logUsername,
            }
          });
        } catch (logErr) {
          console.error('Error creating homemaid log on transfer create:', logErr);
        }

        // تسجيل في سجل عمليات النظام العام
        const postUserInfo = getUserInfoFromReq(req);
        if (postUserInfo.id) {
          try {
            await prisma.systemUserLogs.create({
              data: {
                userId: postUserInfo.id,
                actionType: 'create',
                action: `إنشاء معاملة نقل كفالة #${transfer?.id}${transfer?.HomeMaid?.Name ? ` (${transfer.HomeMaid.Name})` : ''}`.slice(0, 250),
                beneficiary: (transfer?.HomeMaid?.Name || transfer?.NewClient?.fullname || 'معاملة نقل كفالة').slice(0, 250),
                BeneficiaryId: transfer?.HomeMaidId || transfer?.id,
                pageRoute: '/admin/transfersponsorship',
                details: `إنشاء معاملة نقل كفالة - القيمة: ${transfer?.Cost || 0} ر.س | مدة التجربة: ${transfer?.ExperimentDuration || 'غير محدد'} | الكفيل: ${transfer?.NewClient?.fullname || 'غير محدد'}`.slice(0, 1000),
              },
            });
          } catch (sysErr) {
            console.error('Error in systemUserLogs on transfer create:', sysErr);
          }
        }

        // مزامنة وعكس التغيير على صفحة مغادرات السكن (housedworker)
        if (transfer?.HomeMaidId) {
          try {
            const housedWorker = await prisma.housedworker.findFirst({
              where: {
                homeMaid_id: Number(transfer.HomeMaidId),
              },
            });

            if (housedWorker) {
              const existingTsd = (housedWorker.transferSponsorshipData as any) || {};
              const durationDays = transfer.ExperimentDuration ? parseInt(String(transfer.ExperimentDuration).replace(/[^\d]/g, ''), 10) || null : null;
              const updatedTsd = {
                ...existingTsd,
                id: transfer.id,
                totalCost: transfer.Cost ? Number(transfer.Cost) : null,
                paidAmount: transfer.Paid ? Number(transfer.Paid) : null,
                remainingAmount: transfer.remainingCost !== null && transfer.remainingCost !== undefined ? Number(transfer.remainingCost) : null,
                dailyCost: transfer.dailyCost ? Number(transfer.dailyCost) : null,
                trialPeriodDays: durationDays || existingTsd.trialPeriodDays || null,
                trialStartDate: transfer.ExperimentStart ? new Date(transfer.ExperimentStart).toISOString() : existingTsd.trialStartDate,
                trialEndDate: transfer.ExperimentEnd ? new Date(transfer.ExperimentEnd).toISOString() : existingTsd.trialEndDate,
                notes: transfer.Notes || existingTsd.notes || null,
                newSponsorName: transfer.NewClient?.fullname || existingTsd.newSponsorName,
                newSponsorPhone: transfer.NewClient?.phonenumber || existingTsd.newSponsorPhone,
                newSponsorId: transfer.NewClient?.nationalId || existingTsd.newSponsorId,
                newSponsorCity: transfer.NewClient?.city || existingTsd.newSponsorCity,
                lastUpdatedFromTransferId: transfer.id,
                lastUpdatedAt: new Date().toISOString(),
              };

              await prisma.housedworker.update({
                where: { id: housedWorker.id },
                data: {
                  transferSponsorshipData: updatedTsd as any,
                },
              });
            }
          } catch (hwErr) {
            console.error('Error syncing transfer create to housed worker:', hwErr);
          }
        }

        // مزامنة وتحديث كشف الحساب المالي والقيود للكفيل الجديد
        if (transfer?.id) {
          try {
            await syncTransferFinancialStatement(transfer.id);
          } catch (syncErr) {
            console.error('Error syncing transfer financial statement on create:', syncErr);
          }
        }

        return res.status(201).json(transfer);
      } catch (error: any) {
        console.error('خطأ في إنشاء معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: error?.message || 'حدث خطأ في السيرفر أثناء إنشاء المعاملة' });
      }

    // تعديل معاملة نقل كفالة
    case 'PUT':
      try {
        const { id } = req.query;
        const {
          HomeMaidId,
          NewClientId,
          OldClientId,
          Cost,
          ContractDate,
          ExperimentDuration,
          WorkDuration,
          Paid,
          dailyCost,
          remainingCost,
          salaryCertificateFile,
          nationalAddressFile,
          paymentReceiptFile,
          promissoryNoteFile,
          TransferOperationNumber,
          ExperimentStart,
          ExperimentEnd,
          ExperimentRate,
          Notes,
          NationalID,
          TransferingDate,
          file,
          transferStage,
          EntryDate,
          NewClientAltPhone,
          NewClientDateOfBirth,
        } = req.body;

        const resolvedPutNewClientId = NewClientId ? await resolveClientId(NewClientId) : undefined;
        const resolvedPutOldClientId = OldClientId ? await resolveClientId(OldClientId) : undefined;

        // تحديث بيانات العميل الجديد إذا أُرسلت
        if (resolvedPutNewClientId && (NewClientAltPhone || NewClientDateOfBirth)) {
          try {
            await prisma.client.update({
              where: { id: resolvedPutNewClientId },
              data: {
                ...(NewClientAltPhone ? { alternativePhone: NewClientAltPhone } : {}),
                ...(NewClientDateOfBirth ? { dateofbirth: new Date(NewClientDateOfBirth) } : {}),
              },
            });
          } catch (e) {
            console.error('Error updating NewClient in PUT:', e);
          }
        }

        if (!id) {
          return res.status(400).json({ error: 'معرف المعاملة مطلوب' });
        }

        const existing: any = await prisma.transferSponsorShips.findUnique({
          where: { id: Number(id) },
          include: {
            HomeMaid: { select: { id: true, Name: true, Passportnumber: true } },
            NewClient: { select: { id: true, fullname: true, phonenumber: true, nationalId: true, city: true } },
            OldClient: { select: { id: true, fullname: true } },
          },
        });

        if (!existing) {
          return res.status(404).json({ error: 'معاملة نقل الكفالة غير موجودة' });
        }

        let computedRemaining = remainingCost !== undefined ? (remainingCost ? parseFloat(remainingCost) : null) : undefined;
        if (computedRemaining === undefined && (Cost !== undefined || Paid !== undefined)) {
          const finalCost = Cost !== undefined ? (Cost ? parseFloat(Cost) : 0) : Number(existing.Cost || 0);
          const finalPaid = Paid !== undefined ? (Paid ? parseFloat(Paid) : 0) : Number(existing.Paid || 0);
          computedRemaining = Math.max(0, finalCost - finalPaid);
        }

        // رصد التغييرات بدقة لتسجيلها في سجل العمليات (systemUserLogs)
        const changesList: string[] = [];

        if (Cost !== undefined && Number(Cost || 0) !== Number(existing.Cost || 0)) {
          changesList.push(`القيمة المالية لنقل الكفالة: من (${Number(existing.Cost || 0).toLocaleString()} ر.س) إلى (${Number(Cost || 0).toLocaleString()} ر.س)`);
        }
        if (Paid !== undefined && Number(Paid || 0) !== Number(existing.Paid || 0)) {
          changesList.push(`المبلغ المسدد: من (${Number(existing.Paid || 0).toLocaleString()} ر.س) إلى (${Number(Paid || 0).toLocaleString()} ر.س)`);
        }
        if (computedRemaining !== undefined && Number(computedRemaining || 0) !== Number(existing.remainingCost || 0)) {
          changesList.push(`المتبقي: من (${Number(existing.remainingCost || 0).toLocaleString()} ر.س) إلى (${Number(computedRemaining || 0).toLocaleString()} ر.س)`);
        }
        if (dailyCost !== undefined && Number(dailyCost || 0) !== Number(existing.dailyCost || 0)) {
          changesList.push(`التكلفة اليومية: من (${Number(existing.dailyCost || 0).toLocaleString()} ر.س) إلى (${Number(dailyCost || 0).toLocaleString()} ر.س)`);
        }
        if (ExperimentDuration !== undefined && String(ExperimentDuration || '').trim() !== String(existing.ExperimentDuration || '').trim()) {
          changesList.push(`مدة التجربة: من (${existing.ExperimentDuration || 'غير محدد'}) إلى (${ExperimentDuration || 'غير محدد'})`);
        }

        const oldStart = existing.ExperimentStart ? new Date(existing.ExperimentStart).toISOString().split('T')[0] : '';
        const newStart = ExperimentStart ? new Date(ExperimentStart).toISOString().split('T')[0] : '';
        if (ExperimentStart !== undefined && oldStart !== newStart) {
          changesList.push(`بداية التجربة: من (${oldStart || 'غير محدد'}) إلى (${newStart || 'غير محدد'})`);
        }

        const oldEnd = existing.ExperimentEnd ? new Date(existing.ExperimentEnd).toISOString().split('T')[0] : '';
        const newEnd = ExperimentEnd ? new Date(ExperimentEnd).toISOString().split('T')[0] : '';
        if (ExperimentEnd !== undefined && oldEnd !== newEnd) {
          changesList.push(`نهاية التجربة: من (${oldEnd || 'غير محدد'}) إلى (${newEnd || 'غير محدد'})`);
        }

        if (Notes !== undefined && String(Notes || '').trim() !== String(existing.Notes || '').trim()) {
          changesList.push(`ملاحظات التجربة: من (${existing.Notes || 'بدون'}) إلى (${Notes || 'بدون'})`);
        }

        if (transferStage !== undefined && transferStage !== existing.transferStage) {
          changesList.push(`المرحلة: من (${existing.transferStage || 'غير محدد'}) إلى (${transferStage})`);
        }

        if (NationalID !== undefined && String(NationalID || '').trim() !== String(existing.NationalID || '').trim()) {
          changesList.push(`رقم الإقامة/الهوية: من (${existing.NationalID || 'بدون'}) إلى (${NationalID || 'بدون'})`);
        }

        const oldContract = existing.ContractDate ? new Date(existing.ContractDate).toISOString().split('T')[0] : '';
        const newContract = ContractDate ? new Date(ContractDate).toISOString().split('T')[0] : '';
        if (ContractDate !== undefined && oldContract !== newContract) {
          changesList.push(`تاريخ العقد: من (${oldContract || 'غير محدد'}) إلى (${newContract || 'غير محدد'})`);
        }

        if (TransferingDate !== undefined && String(TransferingDate || '').trim() !== String(existing.TransferingDate || '').trim()) {
          changesList.push(`تاريخ نقل الكفالة: من (${existing.TransferingDate || 'غير محدد'}) إلى (${TransferingDate || 'غير محدد'})`);
        }

        if (ExperimentRate !== undefined && ExperimentRate !== existing.ExperimentRate) {
          changesList.push(`تقييم التجربة: من (${existing.ExperimentRate || 'غير محدد'}) إلى (${ExperimentRate || 'غير محدد'})`);
        }

        if (WorkDuration !== undefined && String(WorkDuration || '').trim() !== String(existing.WorkDuration || '').trim()) {
          changesList.push(`مدة العمل: من (${existing.WorkDuration || 'غير محدد'}) إلى (${WorkDuration || 'غير محدد'})`);
        }

        if (salaryCertificateFile !== undefined && salaryCertificateFile !== existing.salaryCertificateFile) {
          changesList.push(`مرفق تعريف الراتب: ${salaryCertificateFile ? 'تم الرفع/التحديث' : 'تم الحذف'}`);
        }
        if (nationalAddressFile !== undefined && nationalAddressFile !== existing.nationalAddressFile) {
          changesList.push(`مرفق العنوان الوطني: ${nationalAddressFile ? 'تم الرفع/التحديث' : 'تم الحذف'}`);
        }
        if (paymentReceiptFile !== undefined && paymentReceiptFile !== existing.paymentReceiptFile) {
          changesList.push(`مرفق إيصال السداد: ${paymentReceiptFile ? 'تم الرفع/التحديث' : 'تم الحذف'}`);
        }
        if (promissoryNoteFile !== undefined && promissoryNoteFile !== existing.promissoryNoteFile) {
          changesList.push(`مرفق سند لأمر: ${promissoryNoteFile ? 'تم الرفع/التحديث' : 'تم الحذف'}`);
        }
        if (file !== undefined && file !== existing.file) {
          changesList.push(`المرفق العام: ${file ? 'تم الرفع/التحديث' : 'تم الحذف'}`);
        }

        if (resolvedPutNewClientId && resolvedPutNewClientId !== existing.NewClientId) {
          changesList.push(`الكفيل الجديد: تم التغيير`);
        }
        if (resolvedPutOldClientId && resolvedPutOldClientId !== existing.OldClientId) {
          changesList.push(`الكفيل السابق: تم التغيير`);
        }

        let effectivePutStage = transferStage;
        let effectivePutRate = ExperimentRate;
        const determinedRate = effectivePutRate !== undefined ? effectivePutRate : existing.ExperimentRate;
        if (determinedRate === 'فاشلة') {
          if (effectivePutStage === undefined || ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'].includes(effectivePutStage)) {
            effectivePutStage = 'فشلت التجربة';
          }
          if (effectivePutRate === undefined) {
            effectivePutRate = 'فاشلة';
          }
        } else if (effectivePutStage === 'فشلت التجربة') {
          effectivePutRate = 'فاشلة';
        }

        const transfer: any = await prisma.transferSponsorShips.update({
          where: { id: Number(id) },
          data: {
            TransferOperationNumber: TransferOperationNumber ? TransferOperationNumber : null,
            HomeMaidId: HomeMaidId ? Number(HomeMaidId) : undefined,
            NewClientId: resolvedPutNewClientId ? resolvedPutNewClientId : undefined,
            OldClientId: resolvedPutOldClientId ? resolvedPutOldClientId : undefined,
            Cost: Cost ? parseFloat(Cost) : undefined,
            Paid: Paid ? parseFloat(Paid) : undefined,
            dailyCost: dailyCost !== undefined ? (dailyCost ? parseFloat(dailyCost) : null) : undefined,
            remainingCost: computedRemaining,
            salaryCertificateFile: salaryCertificateFile !== undefined ? salaryCertificateFile : undefined,
            nationalAddressFile: nationalAddressFile !== undefined ? nationalAddressFile : undefined,
            paymentReceiptFile: paymentReceiptFile !== undefined ? paymentReceiptFile : undefined,
            promissoryNoteFile: promissoryNoteFile !== undefined ? promissoryNoteFile : undefined,
            ExperimentStart: ExperimentStart ? new Date(ExperimentStart) : undefined,
            ExperimentEnd: ExperimentEnd ? new Date(ExperimentEnd) : undefined,
            ExperimentRate: effectivePutRate,
            ContractDate: ContractDate ? new Date(ContractDate) : undefined,
            ExperimentDuration: ExperimentDuration ? ExperimentDuration : undefined,
            WorkDuration,
            Notes,
            transferStage: effectivePutStage,
            NationalID: NationalID !== undefined ? (NationalID && String(NationalID).trim() ? String(NationalID).trim() : null) : undefined,
            TransferingDate,
            file,
            EntryDate: EntryDate ? new Date(EntryDate) : undefined,
          } as any,
          include: {
            HomeMaid: { select: { Name: true, Passportnumber: true } },
            NewClient: { select: { fullname: true, city: true, phonenumber: true, alternativePhone: true, dateofbirth: true } },
            OldClient: { select: { fullname: true } },
          },
        });

        const putUserInfo = getUserInfoFromReq(req);
        const changesSummary = changesList.length > 0 ? changesList.join(' | ') : 'تحديث بيانات المعاملة';

        // 1) تسجيل العملية في سجل العمليات (systemUserLogs)
        if (putUserInfo.id) {
          try {
            await prisma.systemUserLogs.create({
              data: {
                userId: putUserInfo.id,
                actionType: 'update',
                action: `تعديل معاملة نقل كفالة #${id}${transfer.HomeMaid?.Name ? ` (${transfer.HomeMaid.Name})` : ''}`.slice(0, 250),
                beneficiary: (transfer.HomeMaid?.Name || transfer.NewClient?.fullname || 'معاملة نقل كفالة').slice(0, 250),
                BeneficiaryId: transfer.HomeMaidId || Number(id),
                pageRoute: '/admin/transfersponsorship',
                details: changesSummary.slice(0, 1000),
              },
            });
          } catch (sysLogErr) {
            console.error('Error creating systemUserLogs entry on transfer update:', sysLogErr);
          }
        }

        // 2) تسجيل في سجل عمليات العاملة العام (logs)
        try {
          const logUsername = await getValidLogUsername(req);
          await prisma.logs.create({
            data: {
              homemaidId: transfer?.HomeMaidId ? Number(transfer.HomeMaidId) : undefined,
              Details: `تعديل معاملة نقل كفالة #${transfer?.id} (${changesSummary.slice(0, 200)})`,
              reason: "تحديث نقل كفالة",
              Status: transferStage || transfer.transferStage || "نقل الخدمات",
              userId: logUsername,
            }
          });
        } catch (logErr) {
          console.error('Error creating homemaid log on transfer update:', logErr);
        }

        // 4) مزامنة وتحديث كشف الحساب المالي والقيود للكفيل الجديد
        if (transfer?.id) {
          try {
            await syncTransferFinancialStatement(transfer.id);
          } catch (syncErr) {
            console.error('Error syncing transfer financial statement on update:', syncErr);
          }
        }

        // 5) عكس التغيير وانعكاسه على صفحة مغادرات السكن (housedworker)
        const targetHomeMaidId = transfer?.HomeMaidId || existing?.HomeMaidId;
        if (targetHomeMaidId) {
          try {
            const housedWorker = await prisma.housedworker.findFirst({
              where: {
                homeMaid_id: Number(targetHomeMaidId),
              },
              include: {
                Order: true,
                externalHomedmaid: true,
              },
            });

            if (housedWorker) {
              const existingTsd = (housedWorker.transferSponsorshipData as any) || {};

              const durationDays = ExperimentDuration !== undefined
                ? (ExperimentDuration ? parseInt(String(ExperimentDuration).replace(/[^\d]/g, ''), 10) || null : null)
                : (existingTsd.trialPeriodDays || null);

              const updatedTsd = {
                ...existingTsd,
                id: transfer.id,
                ...(Cost !== undefined ? { totalCost: Cost ? Number(Cost) : null } : {}),
                ...(Paid !== undefined ? { paidAmount: Paid ? Number(Paid) : null } : {}),
                ...(computedRemaining !== undefined ? { remainingAmount: computedRemaining } : {}),
                ...(dailyCost !== undefined ? { dailyCost: dailyCost ? Number(dailyCost) : null } : {}),
                ...(ExperimentDuration !== undefined ? { trialPeriodDays: durationDays } : {}),
                ...(ExperimentStart !== undefined ? { trialStartDate: ExperimentStart ? new Date(ExperimentStart).toISOString() : null } : {}),
                ...(ExperimentEnd !== undefined ? { trialEndDate: ExperimentEnd ? new Date(ExperimentEnd).toISOString() : null } : {}),
                ...(Notes !== undefined ? { notes: Notes || null } : {}),
                ...(transfer.NewClient?.fullname ? { newSponsorName: transfer.NewClient.fullname } : {}),
                ...(transfer.NewClient?.phonenumber ? { newSponsorPhone: transfer.NewClient.phonenumber } : {}),
                ...(transfer.NewClient?.nationalId ? { newSponsorId: transfer.NewClient.nationalId } : {}),
                ...(transfer.NewClient?.city ? { newSponsorCity: transfer.NewClient.city } : {}),
                ...(paymentReceiptFile ? { paymentReceiptFile } : {}),
                ...(salaryCertificateFile ? { salaryCertificateFile } : {}),
                ...(nationalAddressFile ? { nationalAddressFile } : {}),
                ...(promissoryNoteFile ? { promissoryNoteFile } : {}),
                lastUpdatedFromTransferId: transfer.id,
                lastUpdatedAt: new Date().toISOString(),
              };

              const isCompleted = transferStage === 'تم نقل الكفالة' || transferStage === 'نقل الخدمات';

              await prisma.housedworker.update({
                where: { id: housedWorker.id },
                data: {
                  transferSponsorshipData: updatedTsd as any,
                  ...(isCompleted ? { deparatureReason: 'مغادرة لنقل الكفالة - تم نقل الكفالة' } : {}),
                },
              });

              // تسجيل في ملاحظات العاملة بالسكن
              try {
                const noteDetails = changesList.length > 0 ? changesList.join(' | ') : 'تحديث بيانات التجربة ونقل الكفالة';
                await prisma.housedWorkerNotes.create({
                  data: {
                    notes: `[تحديث بيانات التجربة ونقل الكفالة من معاملة #${transfer.id}]\n${noteDetails}`.slice(0, 500),
                    housedWorkerId: housedWorker.id,
                    employee: putUserInfo.username || 'النظام',
                  },
                });
              } catch (hwNoteErr) {
                console.warn('Could not add note to housed worker:', hwNoteErr);
              }
            }
          } catch (hwErr) {
            console.error('Error syncing transfer update to housed worker:', hwErr);
          }
        }

        return res.status(200).json(transfer);
      } catch (error) {
        console.error('خطأ في تعديل معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    // حذف معاملة نقل كفالة
    case 'DELETE':
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'معرف المعاملة مطلوب' });
        }

        const deleteUserId = getUserIdFromReq(req);

        const transfer = await prisma.transferSponsorShips.findUnique({
          where: { id: Number(id) },
          include: {
            HomeMaid: { select: { Name: true } },
            NewClient: { select: { fullname: true } },
          },
        });

        await prisma.transferSponsorShips.delete({
          where: { id: Number(id) },
        });

        // تسجيل الحدث
        const logUsername = await getValidLogUsername(req);
        if (transfer?.HomeMaidId) {
          try {
            await prisma.logs.create({
              data: {
                homemaidId: Number(transfer.HomeMaidId),
                Details: `حذف معاملة نقل كفالة #${id}${transfer.HomeMaid?.Name ? ` للعاملة (${transfer.HomeMaid.Name})` : ''}`,
                reason: "حذف نقل كفالة",
                Status: "حذف نقل الكفالة",
                userId: logUsername,
              },
            });
          } catch (delLogErr) {
            console.error('Error creating homemaid log on transfer delete:', delLogErr);
          }
        }

        if (transfer && deleteUserId) {
          eventBus.emit('ACTION', {
            type: `حذف معاملة نقل كفالة #${id} - ${transfer.TransferOperationNumber || 'غير محدد'}`,
            actionType: 'delete',
            userId: deleteUserId,
          });
        }

        return res.status(204).end();
      } catch (error) {
        console.error('خطأ في حذف معاملة نقل الكفالة:', error);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `الطريقة ${method} غير مدعومة` });
  }
}