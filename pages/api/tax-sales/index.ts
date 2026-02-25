import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { from, to, customerId } = req.query;

      const where: any = {};
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(String(from));
        if (to) where.date.lte = new Date(String(to));
      }
      if (customerId) {
        where.customerId = Number(customerId);
      }

      // Note: After running 'npx prisma generate', the customer relation will be available
      const sales = await prisma.taxSalesRecord.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              email: true,
              city: true,
            },
          },
        } as any, // Type assertion until prisma generate is run
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, sales });
    }

    if (req.method === 'POST') {
      const {
        customerId,
        customerName,
        date,
        salesBeforeTax,
        taxRate,
        taxValue,
        salesIncludingTax,
        paymentMethod,
        amount,
        total,
        salesDetailId,
      } = req.body;

      // Validate required fields
      if (!customerId || !date || !salesBeforeTax || !taxRate) {
        return res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: ID العميل، التاريخ، قيمة المبيعات قبل الضريبة، ونسبة الضريبة',
        });
      }

      // Verify customer exists
      const customer = await prisma.client.findUnique({
        where: { id: Number(customerId) },
        select: { id: true, fullname: true },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'العميل غير موجود',
        });
      }

      let detailName: string | null = null;
      if (salesDetailId) {
        const detail = await prisma.taxSalesDetail.findUnique({
          where: { id: Number(salesDetailId) },
          select: { name: true },
        });
        detailName = detail?.name ?? null;
      }

      // Create sales tax record using TaxSalesRecord model with relation
      const salesTax = await prisma.taxSalesRecord.create({
        data: {
          customerId: Number(customerId),
          customerName: customer.fullname || customerName || null,
          date: new Date(date),
          salesBeforeTax: new Prisma.Decimal(salesBeforeTax),
          taxRate: new Prisma.Decimal(taxRate),
          taxValue: new Prisma.Decimal(taxValue || 0),
          salesIncludingTax: new Prisma.Decimal(salesIncludingTax || 0),
          paymentMethod: paymentMethod ? String(paymentMethod) : null,
          attachment: null,
          amount: new Prisma.Decimal(amount || salesBeforeTax),
          total: new Prisma.Decimal(total || salesIncludingTax),
          salesDetailId: salesDetailId ? Number(salesDetailId) : null,
          category: detailName || 'مبيعات',
          description: detailName ? `${detailName} - ${customer.fullname || customerName || ''}` : `مبيعات للعميل ${customer.fullname || customerName || ''}`,
          taxDeclarationId: undefined,
        } as any,
        include: {
          customer: {
            select: {
              id: true,
              fullname: true,
              phonenumber: true,
              email: true,
              city: true,
            },
          },
        } as any, // Type assertion until prisma generate is run
      });

      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `إضافة مبيعات جديدة - العميل: ${customer.fullname || customerName || 'غير محدد'} - المبلغ: ${salesBeforeTax} ريال`,
        actionType: 'add_sales',
        actionStatus: 'success',
        actionAmount: salesBeforeTax,
        actionClientId: Number(customerId),
        actionNotes: `مبيعات قبل الضريبة: ${salesBeforeTax}، نسبة الضريبة: ${taxRate}، المبلغ الإجمالي: ${salesIncludingTax}`,
      });

      return res.status(201).json({ success: true, salesTax });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('TaxSalesRecord API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

