import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import eventBus from 'lib/eventBus';
import { jwtDecode } from 'jwt-decode';
import { logAccountingAction } from 'lib/accountingLogger';

const prisma = new PrismaClient();

// Helper to authenticate user and extract role permissions directly from DB
async function getAuthUserWithPermissions(req: NextApiRequest) {
  let rawToken = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!rawToken) {
    rawToken = cookies.authToken || cookies.token || '';
  }

  if (!rawToken) return null;

  try {
    const token = jwtDecode(rawToken) as any;
    if (!token?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) return null;

    let permissions: any = user.role?.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch {
        permissions = {};
      }
    }

    return {
      id: user.id,
      username: user.username || token.username || 'مستخدم',
      role: user.role?.name || token.role || '',
      permissions: permissions || {}
    };
  } catch (error) {
    console.error('Error authenticating user in statement handler:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const entryType = Array.isArray(req.query.entryType) ? req.query.entryType[0] : req.query.entryType;
      const fromDateStr = Array.isArray(req.query.fromDate) ? req.query.fromDate[0] : req.query.fromDate;
      const toDateStr = Array.isArray(req.query.toDate) ? req.query.toDate[0] : req.query.toDate;
      const searchStr = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

      const whereClause = {
        AND: [] as Prisma.ClientAccountEntryWhereInput[]
      };

      if (entryType && entryType !== 'all') {
        whereClause.AND.push({ entryType });
      }
      if (fromDateStr) {
        whereClause.AND.push({ date: { gte: new Date(fromDateStr) } });
      }
      if (toDateStr) {
        whereClause.AND.push({ date: { lte: new Date(toDateStr) } });
      }
      if (searchStr) {
        whereClause.AND.push({ description: { contains: searchStr } });
      }

      const statement = await prisma.clientAccountStatement.findUnique({
        where: { id: Number(id) },
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true,
              city: true,
              address: true,
              createdAt: true
            }
          },
          entries: {
            where: whereClause.AND.length > 0 ? whereClause : undefined,
            orderBy: [
              { displayOrder: 'asc' },
              { date: 'asc' }
            ]
          }
        }
      });

      // Get order data separately if orderId exists
      let orderData = null;
      if ((statement as any)?.orderId) {
        orderData = await prisma.neworder.findUnique({
          where: { id: (statement as any).orderId },
          include: {
            HomeMaid: {
              include: {
                office: true
              }
            },
            arrivals: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        if (orderData) {
          const rawOrder: any[] = await prisma.$queryRawUnsafe(
            `SELECT Total, paid FROM neworder WHERE id = ?`,
            orderData.id
          );
          if (rawOrder && rawOrder[0]) {
            orderData.Total = rawOrder[0].Total != null ? Number(rawOrder[0].Total) : orderData.Total;
            orderData.paid = rawOrder[0].paid != null ? Number(rawOrder[0].paid) : orderData.paid;
          }
        }
      }

      if (!statement) {
        return res.status(404).json({ error: 'Not found' });
      }

      const entries = statement.entries;
      const totalDebit = entries.reduce((sum: number, e: { debit: Prisma.Decimal }) => sum + Number(e.debit), 0);
      const totalCredit = entries.reduce((sum: number, e: { credit: Prisma.Decimal }) => sum + Number(e.credit), 0);
      const netAmount = Number(totalDebit) - Number(totalCredit); // الرصيد: مدين يزيد، دائن يقلل

      // فرز القيود لضمان ظهور الفواتير قبل المدفوعات عند تطابق التاريخ والترتيب
      const sortedEntries = [...entries].sort((a, b) => {
        const orderA = a.displayOrder ?? 0;
        const orderB = b.displayOrder ?? 0;
        if (orderA !== orderB) return orderA - orderB;

        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;

        // وضع الفاتورة (مدين) قبل السداد (دائن) عند تطابق التاريخ
        if (a.entryType === 'invoice' && b.entryType !== 'invoice') return -1;
        if (a.entryType !== 'invoice' && b.entryType === 'invoice') return 1;

        return a.id - b.id;
      });

      // إعادة حساب الرصيد الجاري لكل قيد: مدين يزيد، دائن يقلل
      let runningBalance = 0;
      const entriesWithBalance = sortedEntries.map((e: { id: number; date: Date; description: string; debit: Prisma.Decimal; credit: Prisma.Decimal; balance: Prisma.Decimal; entryType: string; isEditable?: boolean; [k: string]: any }) => {
        runningBalance += Number(e.debit) - Number(e.credit);
        return { ...e, balance: runningBalance };
      });

      res.status(200).json({
        ...statement,
        entries: entriesWithBalance,
        order: orderData,
        totals: { totalDebit, totalCredit, netAmount }
      });
    } catch (error) {
      console.error('Error fetching client account statement:', error);
      res.status(500).json({ error: 'Failed to fetch client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'PUT') {
    try {
      const authUser = await getAuthUserWithPermissions(req);
      if (!authUser) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      }

      const hasEditPermission = authUser.permissions?.['إدارة المحاسبة']?.['تعديل'] === true;
      if (!hasEditPermission) {
        return res.status(403).json({ error: 'غير مصرح لك بتعديل حسابات العملاء. يجب تفعيل صلاحية التعديل في إدارة المحاسبة.' });
      }

      const {
        contractNumber,
        officeName,
        contractStatus,
        notes,
        attachment,
        totalRevenue: providedRevenue,
        totalExpenses: providedExpenses,
        masandTransferAmount,
        netAmount: providedNetAmount
      } = req.body;

      let totalRevenue: number;
      let totalExpenses: number;
      let netAmount: number;

      const hasManualTotals =
        providedRevenue !== undefined && providedExpenses !== undefined;

      if (hasManualTotals) {
        totalRevenue = Number(providedRevenue) || 0;
        totalExpenses = Number(providedExpenses) || 0;
        
        const commissionPercentage = req.body.commissionPercentage !== undefined 
          ? Number(req.body.commissionPercentage) 
          : 0;
        const commissionAmount = totalRevenue * (commissionPercentage / 100);
        
        netAmount =
          providedNetAmount !== undefined
            ? Number(providedNetAmount) || 0
            : totalRevenue - totalExpenses - commissionAmount;
      } else {
        const entries = await prisma.clientAccountEntry.findMany({
          where: { statementId: Number(id) }
        });
        totalRevenue = entries.reduce((sum, entry) => sum + Number(entry.credit), 0);
        totalExpenses = entries.reduce((sum, entry) => sum + Number(entry.debit), 0);
        
        const currentStatement = await prisma.clientAccountStatement.findUnique({
          where: { id: Number(id) },
          select: { commissionPercentage: true }
        });
        const commissionPercentage = currentStatement?.commissionPercentage 
          ? Number(currentStatement.commissionPercentage) 
          : 0;
        const commissionAmount = totalRevenue * (commissionPercentage / 100);
        
        netAmount = totalRevenue - totalExpenses - commissionAmount;
      }

      const updateData: any = {
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        masandTransferAmount: masandTransferAmount !== undefined ? Number(masandTransferAmount) : undefined,
        netAmount,
        contractStatus,
        notes
      };

      if (attachment !== undefined) {
        updateData.attachment = attachment;
      }

      const statement = await prisma.clientAccountStatement.update({
        where: {
          id: Number(id)
        },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              nationalId: true
            }
          }
        }
      });

      // Log accounting action
      await logAccountingAction({
        action: `تعديل حساب عميل - رقم العقد: ${contractNumber}`,
        actionType: 'update_client_account',
        actionStatus: 'success',
        actionClientId: statement.client.id,
        actionUserId: authUser.id,
        actionAmount: netAmount,
        actionNotes: `تعديل حساب عميل بواسطة ${authUser.username} - الإيرادات: ${totalRevenue}، المصروفات: ${totalExpenses}، الصافي: ${netAmount}${officeName ? ` - المكتب: ${officeName}` : ''}${contractStatus ? ` - حالة العقد: ${contractStatus}` : ''}`,
      });

      res.status(200).json(statement);
    } catch (error) {
      console.error('Error updating client account statement:', error);
      res.status(500).json({ error: 'Failed to update client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'DELETE') {
    try {
      const authUser = await getAuthUserWithPermissions(req);
      if (!authUser) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
      }

      const hasDeletePermission = authUser.permissions?.['إدارة المحاسبة']?.['حذف'] === true;
      if (!hasDeletePermission) {
        return res.status(403).json({ error: 'غير مصرح لك بحذف حسابات العملاء. يجب تفعيل صلاحية الحذف في إدارة المحاسبة.' });
      }

      // Get statement info before deletion for logging
      const statementToDelete = await prisma.clientAccountStatement.findUnique({
        where: { id: Number(id) },
        include: { client: { select: { id: true, fullname: true, nationalId: true } }, entries: true }
      });

      if (!statementToDelete) {
        return res.status(404).json({ error: 'كشف الحساب غير موجود' });
      }

      // Delete in transaction (entries first, then statement)
      await prisma.$transaction(async (tx) => {
        await tx.clientAccountEntry.deleteMany({
          where: { statementId: Number(id) }
        });

        await tx.clientAccountStatement.delete({
          where: { id: Number(id) }
        });
      });

      // Log accounting action
      await logAccountingAction({
        action: `حذف كشف حساب عميل - رقم العقد: ${statementToDelete.contractNumber || 'غير محدد'} - العميل: ${statementToDelete.client?.fullname || 'غير محدد'}`,
        actionType: 'delete_client_account',
        actionStatus: 'success',
        actionClientId: statementToDelete.clientId,
        actionUserId: authUser.id,
        actionAmount: Number(statementToDelete.netAmount) || Number(statementToDelete.totalRevenue) || 0,
        actionNotes: `تم حذف كشف الحساب بالكامل #${statementToDelete.id} بواسطة المستخدم: ${authUser.username} (ID: ${authUser.id}) | العميل: ${statementToDelete.client?.fullname || 'غير محدد'} | رقم العقد: ${statementToDelete.contractNumber || 'غير محدد'} | الإيرادات: ${statementToDelete.totalRevenue} | المصروفات: ${statementToDelete.totalExpenses} | الصافي: ${statementToDelete.netAmount}`,
      });

      res.status(200).json({ message: 'Client account statement deleted successfully' });
    } catch (error) {
      console.error('Error deleting client account statement:', error);
      res.status(500).json({ error: 'Failed to delete client account statement' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
