import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'معرف السجل مطلوب',
      });
    }

    if (req.method === 'PUT') {
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

      // Update sales tax record
      const salesTax = await prisma.taxSalesRecord.update({
        where: { id: parseInt(id) },
        data: {
          customerId: Number(customerId),
          customerName: customer.fullname || customerName || null,
          date: new Date(date),
          salesBeforeTax: new Prisma.Decimal(salesBeforeTax),
          taxRate: new Prisma.Decimal(taxRate),
          taxValue: new Prisma.Decimal(taxValue || 0),
          salesIncludingTax: new Prisma.Decimal(salesIncludingTax || 0),
          paymentMethod: paymentMethod ? String(paymentMethod) : null,
          amount: new Prisma.Decimal(amount || salesBeforeTax),
          total: new Prisma.Decimal(total || salesIncludingTax),
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
        } as any,
      });

      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `تعديل مبيعات - العميل: ${customer.fullname || customerName || 'غير محدد'} - المبلغ: ${salesBeforeTax} ريال`,
        actionType: 'update_sales',
        actionStatus: 'success',
        actionAmount: salesBeforeTax,
        actionClientId: Number(customerId),
        actionNotes: `تعديل مبيعات - المبلغ قبل الضريبة: ${salesBeforeTax}، نسبة الضريبة: ${taxRate}، المبلغ الإجمالي: ${salesIncludingTax}`,
      });

      return res.status(200).json({ success: true, salesTax });
    }

    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('TaxSalesRecord update error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

