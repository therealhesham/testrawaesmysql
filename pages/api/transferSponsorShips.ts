import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
import { syncTransferFinancialStatement } from 'lib/transferFinancialSync';

function getUserInfoFromReq(req: NextApiRequest): { id: number | null; username: string } {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return { id: null, username: 'النظام' };
  try {
    const cookies: { [key: string]: string } = {};
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
    if (cookies.authToken) {
      const token = jwtDecode(cookies.authToken) as any;
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
          return res.status(200).json(transfer);
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
          });
        } else if (tab === 'completed') {
          andConditions.push({
            transferStage: { in: ['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'] },
          });
        } else if (tab === 'failed') {
          andConditions.push({
            transferStage: { in: ['فشلت التجربة'] },
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
          andConditions.push({
            OR: [
              { TransferOperationNumber: { contains: searchTerm as string } },
              { NewClient: { fullname: { contains: searchTerm as string } } },
              { HomeMaid: { Name: { contains: searchTerm as string } } },
              { HomeMaid: { Passportnumber: { contains: searchTerm as string } } },
              { NationalID: { contains: searchTerm as string } },
              { OldClient: { fullname: { contains: searchTerm as string } } },
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
            ExperimentStart: true,
          },
        });

        let trialsCount = 0;
        let completedCount = 0;
        let failedCount = 0;

        for (const t of allTransfersSummary) {
          const stage = t.transferStage || '';
          if (['تم نقل الكفالة', 'نقل الخدمات', 'انشاء العقد', 'انشاء الطلب'].includes(stage)) {
            completedCount++;
          } else if (stage === 'فشلت التجربة') {
            failedCount++;
          } else if (
            ['في المرحلة التجريبية', 'فترة التجربة', 'تقييم التجربة'].includes(stage) ||
            (t.ExperimentStart && !['تم نقل الكفالة', 'نقل الخدمات', 'فشلت التجربة'].includes(stage))
          ) {
            trialsCount++;
          }
        }
        const allCount = allTransfersSummary.length;

        const totalPages = Math.ceil(total / limitNum);

        return res.status(200).json({
          transfers,
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

          // تسجيل في سجلات النظام
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
              ExperimentRate,
              Notes,
              TransferOperationNumber: TransferOperationNumber ? TransferOperationNumber : null,
              ContractDate: ContractDate ? new Date(ContractDate) : undefined,
              EntryDate: EntryDate ? new Date(EntryDate) : undefined,
              ExperimentDuration: ExperimentDuration ? ExperimentDuration : undefined,
              WorkDuration,
              transferStage,
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
              ExperimentRate,
              Notes,
              TransferOperationNumber: TransferOperationNumber ? TransferOperationNumber : null,
              ContractDate: ContractDate ? new Date(ContractDate) : null,
              EntryDate: EntryDate ? new Date(EntryDate) : null,
              ExperimentDuration: ExperimentDuration ? ExperimentDuration : null,
              WorkDuration,
              transferStage,
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
        try {
          await prisma.logs.create({
            data: {
              homemaidId: Number(HomeMaidId),
              Details: `توثيق معاملة نقل كفالة للعاملة (${transfer?.HomeMaid?.Name || 'عاملة'}) للكفيل الجديد (${transfer?.NewClient?.fullname || 'غير محدد'}) - إجمالي التكلفة: ${Cost || 0} ر.س، المسدد: ${Paid || 0} ر.س`,
              reason: "نقل كفالة",
              Status: transferStage || "نقل الخدمات",
            }
          });
        } catch (logErr) {
          console.error('Error creating homemaid log on transfer create:', logErr);
        }

        // تسجيل في سجل عمليات النظام العام
        const userId = getUserIdFromReq(req);
        if (userId) {
          eventBus.emit('ACTION', {
            type: `إنشاء معاملة نقل كفالة #${transfer?.id} للعاملة (${transfer?.HomeMaid?.Name || ''}) للكفيل (${transfer?.NewClient?.fullname || ''})`,
            actionType: 'create',
            userId: userId,
          });
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

        let computedRemaining = remainingCost !== undefined ? (remainingCost ? parseFloat(remainingCost) : null) : undefined;
        if (computedRemaining === undefined && (Cost !== undefined || Paid !== undefined)) {
          const existing = await prisma.transferSponsorShips.findUnique({ where: { id: Number(id) } });
          if (existing) {
            const finalCost = Cost !== undefined ? (Cost ? parseFloat(Cost) : 0) : Number(existing.Cost || 0);
            const finalPaid = Paid !== undefined ? (Paid ? parseFloat(Paid) : 0) : Number(existing.Paid || 0);
            computedRemaining = Math.max(0, finalCost - finalPaid);
          }
        }

        const transfer: any = await prisma.transferSponsorShips.update({
          where: { id: Number(id) },
          data: {
            TransferOperationNumber:TransferOperationNumber?TransferOperationNumber:null,
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
            ExperimentRate,
            ContractDate:ContractDate?new Date(ContractDate):undefined,
            ExperimentDuration: ExperimentDuration ? ExperimentDuration : undefined,
            WorkDuration,
            Notes,
            transferStage,
            NationalID,
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

        // تسجيل في سجل عمليات العاملة
        try {
          await prisma.logs.create({
            data: {
              homemaidId: transfer?.HomeMaidId ? Number(transfer.HomeMaidId) : undefined,
              Details: `تحديث معاملة نقل كفالة #${transfer?.id} للعاملة (${transfer?.HomeMaid?.Name || 'عاملة'}) - مرحلة: ${transferStage || 'نقل الخدمات'}`,
              reason: "تحديث نقل كفالة",
              Status: transferStage || "نقل الخدمات",
            }
          });
        } catch (logErr) {
          console.error('Error creating homemaid log on transfer update:', logErr);
        }

        // تسجيل في سجل عمليات النظام العام
        const putUserId = getUserIdFromReq(req);
        if (putUserId) {
          eventBus.emit('ACTION', {
            type: `تعديل معاملة نقل كفالة #${transfer?.id} للعاملة (${transfer?.HomeMaid?.Name || ''})`,
            actionType: 'update',
            userId: putUserId,
          });
        }

        // مزامنة وتحديث كشف الحساب المالي والقيود للكفيل الجديد
        if (transfer?.id) {
          try {
            await syncTransferFinancialStatement(transfer.id);
          } catch (syncErr) {
            console.error('Error syncing transfer financial statement on update:', syncErr);
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