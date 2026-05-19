import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';
import { jwtDecode } from 'jwt-decode';
import cookie from 'cookie';
import { logAccountingActionFromRequest, getUserFromCookies } from 'lib/accountingLogger';
import eventBus from 'lib/eventBus';

// Helper function to recalculate totals from entries
async function recalculateStatementTotals(statementId: number) {
  const entries = await prisma.clientAccountEntry.findMany({
    where: { statementId }
  });

  const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
  const netAmount = totalDebit - totalCredit; // الرصيد: مدين يزيد، دائن يقلل

  await prisma.clientAccountStatement.update({
    where: { id: statementId },
    data: {
      totalRevenue: totalDebit,
      totalExpenses: totalCredit,
      netAmount
    }
  });

  return { totalDebit, totalCredit, netAmount };
}

// Helper function to recalculate all balances after a specific date
async function recalculateBalancesAfterDate(statementId: number, fromDate: Date) {
  const allEntries = await prisma.clientAccountEntry.findMany({
    where: { statementId },
    orderBy: { date: 'asc' }
  });

  let runningBalance = 0;
  for (const entry of allEntries) {
    runningBalance = runningBalance + Number(entry.debit) - Number(entry.credit);
    
    if (entry.date >= fromDate || Number(entry.balance) !== runningBalance) {
      await prisma.clientAccountEntry.update({
        where: { id: entry.id },
        data: { balance: runningBalance }
      });
    }
  }
}

/**
 * POST/PUT /api/client-accounts/create-from-order
 * Body: { orderId: number, total?: number, paid?: number }
 * POST = ينشئ كشف حساب العميل + قيد "دفعة أولى" للطلب
 * PUT = يعدل إجمالي قيمة العقد والدفعة الأولى المحفوظة
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { orderId, total: bodyTotal, paid: bodyPaid } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'رقم الطلب مطلوب' });
    }

    try {
      const order = await prisma.neworder.findUnique({
        where: { id: Number(orderId) },
        include: {
          client: true,
          HomeMaid: { include: { office: true } },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }

      const existingStatement = await prisma.clientAccountStatement.findFirst({
        where: { orderId: Number(orderId) },
      });
      if (existingStatement) {
        const oldTotal = order.Total ?? 0;
        const downpaymentEntry = await prisma.clientAccountEntry.findFirst({
          where: {
            statementId: existingStatement.id,
            description: { in: ['دفعة أولى', 'سداد كامل'] },
          },
        });

        const paidAmount =
          bodyPaid != null && !Number.isNaN(Number(bodyPaid))
            ? Number(bodyPaid)
            : typeof order.paid === 'number' && !Number.isNaN(order.paid)
              ? order.paid
              : Number(order.paid) || 0;

        const newTotal = bodyTotal != null && !Number.isNaN(Number(bodyTotal)) ? Number(bodyTotal) : oldTotal;

        const isFullPayment = paidAmount > 0 && paidAmount === newTotal;
        const description = isFullPayment ? 'سداد كامل' : 'دفعة أولى';

        // 1. تحديث قيم الطلب في قاعدة البيانات
        await prisma.neworder.update({
          where: { id: Number(orderId) },
          data: {
            Total: newTotal,
            paid: paidAmount,
          },
        });

        // 2. تحديث قيد فاتورة التعاقد (مدين) أو إنشاؤه إن لم يكن موجوداً
        const invoiceEntry = await prisma.clientAccountEntry.findFirst({
          where: {
            statementId: existingStatement.id,
            description: 'فاتورة التعاقد',
          },
        });

        if (invoiceEntry) {
          await prisma.clientAccountEntry.update({
            where: { id: invoiceEntry.id },
            data: {
              debit: newTotal,
            },
          });
        } else {
          await prisma.clientAccountEntry.create({
            data: {
              isEditable: false,
              statementId: existingStatement.id,
              date: new Date(existingStatement.createdAt),
              description: 'فاتورة التعاقد',
              debit: newTotal,
              credit: 0,
              balance: newTotal,
              entryType: 'invoice',
            },
          });
        }

        // 3. تحديث قيد الدفعة الأولى أو إنشاؤه إن لم يكن موجوداً
        let entryDate = new Date();
        if (downpaymentEntry) {
          entryDate = downpaymentEntry.date;
          await prisma.clientAccountEntry.update({
            where: { id: downpaymentEntry.id },
            data: {
              credit: paidAmount,
              description: description,
            },
          });
        } else {
          await prisma.clientAccountEntry.create({
            data: {
              isEditable: false,
              statementId: existingStatement.id,
              date: new Date(),
              description: description,
              debit: 0,
              credit: paidAmount,
              balance: paidAmount,
              entryType: 'payment',
            },
          });
        }

        // 3. إعادة حساب الأرصدة التراكمية الجارية
        await recalculateBalancesAfterDate(existingStatement.id, entryDate);

        // 4. إعادة حساب الإجماليات لكشف الحساب
        await recalculateStatementTotals(existingStatement.id);

        // 5. تسجيل العملية في سجلات النظام
        const { userId, username } = getUserFromCookies(req);

        const paymentLabel = isFullPayment ? 'سداد كامل المبلغ' : 'الدفعة الأولى';
        const actionText = isFullPayment ? 'سداد كامل المبلغ' : 'إضافة دفعة أولى';

        // سجل العمليات المحاسبي المالي
        await logAccountingActionFromRequest(req, {
          action: `إنشاء السجلات المحاسبية للطلب ORD-${orderId}`,
          actionType: 'create_client_account',
          actionStatus: 'success',
          actionClientId: Number(order.clientID ?? order.client?.id),
          actionAmount: paidAmount,
          actionNotes: `إنشاء السجلات المحاسبية للطلب ORD-${orderId} - إجمالي العقد: ${newTotal} - ${paymentLabel}: ${paidAmount}`,
        });

        // سجل عمليات مستخدمي النظام العام (من خلال الـ eventBus لتوحيد العرض والـ format)
        if (userId) {
          try {
            eventBus.emit('ACTION', {
              type: `${actionText} من خلال صفحة تتبع الطلب #${orderId} - إجمالي العقد: ${newTotal}، المدفوع: ${paidAmount}`,
              beneficiary: "order",
              pageRoute: `/admin/track_order/${orderId}/`,
              actionType: "create",
              userId: userId,
              BeneficiaryId: Number(orderId),
            });
          } catch (err) {
            console.error("Error emitting ACTION in POST accounting initialization:", err);
          }
        }

        // سجل أنشطة العاملة العام
        try {
          await prisma.logs.create({
            data: {
              Status: "إضافة سجل محاسبي",
              homemaidId: order.HomemaidId,
              Details: `${actionText} من خلال صفحة تتبع الطلب #${orderId} - إجمالي العقد: ${newTotal}، ${paymentLabel}: ${paidAmount}`,
              reason: "إضافة سجل محاسبي",
              userId: username || 'غير محدد',
            }
          });
        } catch (err) {
          console.error("Error creating logs in POST accounting initialization:", err);
        }

        return res.status(200).json({
          message: 'تم إنشاء السجلات المحاسبية بنجاح',
          statementId: existingStatement.id,
        });
      }

      const clientId = order.clientID ?? order.client?.id;
      if (!clientId) {
        return res.status(400).json({ message: 'الطلب غير مرتبط بعميل' });
      }

      const officeName =
        (order.HomeMaid as any)?.officeName ||
        (order.HomeMaid as any)?.office?.office ||
        '';

      // المبلغ المدفوع (دفعة أولى): من الجسم إن وُجد وإلا من الطلب
      const paidAmount =
        bodyPaid != null && !Number.isNaN(Number(bodyPaid))
          ? Number(bodyPaid)
          : typeof order.paid === 'number' && !Number.isNaN(order.paid)
            ? order.paid
            : Number(order.paid) || 0;

      // تحديث المبلغ المطلوب والمدفوع في الطلب إن وُجد في الجسم
      if (bodyTotal != null && !Number.isNaN(Number(bodyTotal))) {
        await prisma.neworder.update({
          where: { id: Number(orderId) },
          data: {
            Total: Number(bodyTotal),
            paid: Number(paidAmount),
          },
        });
      }

       const isFullPayment = paidAmount > 0 && Number(paidAmount) === Number(bodyTotal || 0);
      const description = isFullPayment ? 'سداد كامل' : 'دفعة أولى';

      const statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: Number(clientId),
          orderId: Number(orderId),
          contractNumber: `ORD-${orderId}`,
          officeName,
          totalRevenue: paidAmount,
          totalExpenses: 0,
          netAmount: paidAmount,
          contractStatus: order.bookingstatus || null,
          notes: 'تم إنشاؤها من صفحة تتبع الطلب (انشاء سجلات محاسبية)',
        },
      });

      // 1. إنشاء قيد فاتورة التعاقد (مدين)
      await prisma.clientAccountEntry.create({
        data: {
          isEditable: false,
          statementId: statement.id,
          date: new Date(),
          description: 'فاتورة التعاقد',
          debit: Number(bodyTotal || 0),
          credit: 0,
          balance: Number(bodyTotal || 0),
          entryType: 'invoice',
        },
      });

      // 2. إنشاء قيد السداد (دائن) في حال وجود مبلغ مدفوع
      if (paidAmount > 0) {
        await prisma.clientAccountEntry.create({
          data: {
            isEditable: false,
            statementId: statement.id,
            date: new Date(),
            description: description,
            debit: 0,
            credit: paidAmount,
            balance: paidAmount,
            entryType: 'payment',
          },
        });
      }

      const { userId, username } = getUserFromCookies(req);
      const paymentLabel = isFullPayment ? 'سداد كامل المبلغ' : 'دفعة أولى';

      try {
        await prisma.logs.create({
          data: {
            Status: "إضافة سجل محاسبي",
            homemaidId: order.HomemaidId,
            Details: `إنشاء السجلات المحاسبية للطلب #${orderId} - إجمالي العقد: ${bodyTotal || 0}، ${paymentLabel}: ${paidAmount}`,
            reason: "إضافة سجل محاسبي",
            userId: username || 'غير محدد',
          }
        });
      } catch (error) {
        console.error('Error creating homemaid log in new accounting records path:', error);
      }

      if (userId) {
        try {
          eventBus.emit('ACTION', {
            type: `إنشاء السجلات المحاسبية للطلب #${orderId} - إجمالي العقد: ${bodyTotal || 0}، ${paymentLabel}: ${paidAmount}`,
            beneficiary: "order",
            pageRoute: `/admin/track_order/${orderId}/`,
            actionType: "create",
            userId: userId,
            BeneficiaryId: Number(orderId),
          });
        } catch (error) {
          console.error('Error emitting ACTION event for new accounting records path:', error);
        }
      }

      return res.status(200).json({
        message: 'تم إنشاء السجلات المحاسبية بنجاح',
        statementId: statement.id,
      });
    } catch (error) {
      console.error('Error creating accounting records from order:', error);
      return res.status(500).json({
        message: 'حدث خطأ أثناء إنشاء السجلات المحاسبية',
        details: (error as Error).message,
      });
    }
  } else if (req.method === 'PUT') {
    const { orderId, total: bodyTotal, paid: bodyPaid } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'رقم الطلب مطلوب' });
    }

    try {
      const order = await prisma.neworder.findUnique({
        where: { id: Number(orderId) },
        include: {
          client: true,
          HomeMaid: { include: { office: true } },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'الطلب غير موجود' });
      }

      const statement = await prisma.clientAccountStatement.findFirst({
        where: { orderId: Number(orderId) },
      });

      if (!statement) {
        return res.status(404).json({ message: 'السجل المحاسبي غير موجود لهذا الطلب' });
      }

      // 1. جلب القيم القديمة من أجل التوثيق في سجل العمليات
      const oldTotal = order.Total ?? 0;
      
      // العثور على قيد "دفعة أولى" أو "سداد كامل" الحالي
      const downpaymentEntry = await prisma.clientAccountEntry.findFirst({
        where: {
          statementId: statement.id,
          description: { in: ['دفعة أولى', 'سداد كامل'] },
        },
      });

      const oldPaid = downpaymentEntry ? Number(downpaymentEntry.credit) : 0;

      // حساب القيم الجديدة
      const newTotal = bodyTotal != null && !Number.isNaN(Number(bodyTotal)) ? Number(bodyTotal) : oldTotal;
      const newPaid = bodyPaid != null && !Number.isNaN(Number(bodyPaid)) ? Number(bodyPaid) : oldPaid;

      const isFullPayment = newPaid > 0 && newPaid === newTotal;
      const description = isFullPayment ? 'سداد كامل' : 'دفعة أولى';

      // 2. تحديث قيم الطلب في قاعدة البيانات
      await prisma.neworder.update({
        where: { id: Number(orderId) },
        data: {
          Total: newTotal,
          paid: newPaid,
        },
      });

      // 2.1 البحث عن قيد فاتورة التعاقد (مدين) أو إنشاؤه إن لم يكن موجوداً
      const invoiceEntry = await prisma.clientAccountEntry.findFirst({
        where: {
          statementId: statement.id,
          description: 'فاتورة التعاقد',
        },
      });

      if (invoiceEntry) {
        await prisma.clientAccountEntry.update({
          where: { id: invoiceEntry.id },
          data: {
            debit: newTotal,
          },
        });
      } else {
        await prisma.clientAccountEntry.create({
          data: {
            isEditable: false,
            statementId: statement.id,
            date: new Date(statement.createdAt),
            description: 'فاتورة التعاقد',
            debit: newTotal,
            credit: 0,
            balance: newTotal,
            entryType: 'invoice',
          },
        });
      }

      // 3. تحديث قيد الدفعة الأولى أو إنشاؤه إن لم يكن موجوداً
      let entryDate = new Date();
      if (downpaymentEntry) {
        entryDate = downpaymentEntry.date;
        await prisma.clientAccountEntry.update({
          where: { id: downpaymentEntry.id },
          data: {
            credit: newPaid,
            description: description,
          },
        });
      } else {
        await prisma.clientAccountEntry.create({
          data: {
            isEditable: false,
            statementId: statement.id,
            date: new Date(),
            description: description,
            debit: 0,
            credit: newPaid,
            balance: newPaid,
            entryType: 'payment',
          },
        });
      }

      // 4. إعادة حساب الأرصدة التراكمية الجارية
      await recalculateBalancesAfterDate(statement.id, entryDate);

      // 5. إعادة حساب الإجماليات لكشف الحساب
      await recalculateStatementTotals(statement.id);

      // 6. تسجيل العملية في سجلات النظام

      const { userId, username } = getUserFromCookies(req);
      const isOldFullPayment = oldPaid > 0 && oldPaid === oldTotal;
      const oldPaymentLabel = isOldFullPayment ? 'سداد كامل' : 'الدفعة الأولى';

      const isNewFullPayment = newPaid > 0 && newPaid === newTotal;
      const newPaymentLabel = isNewFullPayment ? 'سداد كامل' : 'الدفعة الأولى';

      // 6.2 سجل العمليات المحاسبي (AccountSystemLogs)
      await logAccountingActionFromRequest(req, {
        action: `تعديل السجلات المحاسبية للطلب ORD-${orderId}`,
        actionType: 'update_client_account',
        actionStatus: 'success',
        actionClientId: Number(order.clientID ?? order.client?.id),
        actionAmount: newPaid,
        actionNotes: `تعديل السجلات المحاسبية للطلب ORD-${orderId} - إجمالي العقد القديم: ${oldTotal} الجديد: ${newTotal} - ${oldPaymentLabel} القديمة: ${oldPaid} - ${newPaymentLabel} الجديدة: ${newPaid}`,
      });

      // 6.3 سجل عمليات مستخدمي النظام العام (من خلال الـ eventBus لتوحيد العرض والـ format)
      if (userId) {
        try {
          eventBus.emit('ACTION', {
            type: `تعديل السجلات المحاسبية للطلب #${orderId} - إجمالي العقد القديم: ${oldTotal} الجديد: ${newTotal} - ${oldPaymentLabel} القديمة: ${oldPaid} - ${newPaymentLabel} الجديدة: ${newPaid}`,
            beneficiary: "order",
            pageRoute: `/admin/track_order/${orderId}/`,
            actionType: "update",
            userId: userId,
            BeneficiaryId: Number(orderId),
          });
        } catch (err) {
          console.error("Error emitting ACTION in PUT accounting edit:", err);
        }
      }

      // 6.4 سجل أنشطة العاملة العام (logs)
      try {
        await prisma.logs.create({
          data: {
            Status: "تعديل سجل محاسبي",
            homemaidId: order.HomemaidId,
            Details: `تعديل السجلات المحاسبية للطلب #${orderId} - إجمالي العقد الجديد: ${newTotal}، ${newPaymentLabel} الجديدة: ${newPaid}`,
            reason: "تعديل سجل محاسبي",
            userId: username,
          }
        });
      } catch (err) {
        console.error("Error creating logs in PUT accounting edit:", err);
      }

      return res.status(200).json({
        message: 'تم تعديل السجلات المحاسبية بنجاح',
        statementId: statement.id,
      });

    } catch (error) {
      console.error('Error updating accounting records from order:', error);
      return res.status(500).json({
        message: 'حدث خطأ أثناء تعديل السجلات المحاسبية',
        details: (error as Error).message,
      });
    }
  } else {
    res.setHeader('Allow', ['POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
