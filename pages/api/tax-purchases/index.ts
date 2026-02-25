import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { from, to } = req.query;

      const where: any = {};
      if (from || to) {
        where.date = {};
        if (from) where.date.gte = new Date(String(from));
        if (to) where.date.lte = new Date(String(to));
      }

      const purchases = await prisma.taxPurchaseRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ success: true, purchases });
    }

    if (req.method === 'POST') {
      const {
        supplierName: bodySupplierName,
        supplierId,
        date,
        status,
        invoiceNumber,
        supplyType,
        purchasesBeforeTax,
        taxRate,
        taxValue,
        purchasesIncludingTax,
        amount,
        total,
        purchaseDetailId,
      } = req.body;

      // Resolve supplier name from supplierId or use provided supplierName
      let supplierName: string = '';
      if (supplierId) {
        const supplier = await prisma.taxSupplier.findUnique({
          where: { id: Number(supplierId) },
          select: { name: true },
        });
        supplierName = supplier?.name ?? bodySupplierName ?? '';
      } else {
        supplierName = bodySupplierName ? String(bodySupplierName) : '';
      }

      // Validate required fields
      if (!supplierName.trim() || !date || !purchasesBeforeTax || !taxRate) {
        return res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: اسم المورد (أو اختر من القائمة)، التاريخ، قيمة المشتريات قبل الضريبة، ونسبة الضريبة',
        });
      }

      let detailName: string | null = null;
      if (purchaseDetailId) {
        const detail = await prisma.taxPurchaseDetail.findUnique({
          where: { id: Number(purchaseDetailId) },
          select: { name: true },
        });
        detailName = detail?.name ?? null;
      }

      const purchaseTax = await prisma.taxPurchaseRecord.create({
        data: {
          supplierId: supplierId ? Number(supplierId) : null,
          supplierName: supplierName.trim(),
          date: new Date(date),
          status: status ? String(status) : 'مدفوعة',
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
          supplyType: supplyType ? String(supplyType) : null,
          purchasesBeforeTax: new Prisma.Decimal(purchasesBeforeTax),
          taxRate: new Prisma.Decimal(taxRate),
          taxValue: new Prisma.Decimal(taxValue || 0),
          purchasesIncludingTax: new Prisma.Decimal(purchasesIncludingTax || 0),
          attachment: null,
          amount: new Prisma.Decimal(amount || purchasesBeforeTax),
          total: new Prisma.Decimal(total || purchasesIncludingTax),
          purchaseDetailId: purchaseDetailId ? Number(purchaseDetailId) : null,
          category: detailName || 'مشتريات',
          description: detailName ? `${detailName} - ${supplierName}` : `مشتريات من المورد ${supplierName}`,
          taxDeclarationId: undefined,
        } as any,
      });

      // Log accounting action
      await logAccountingActionFromRequest(req, {
        action: `إضافة مشتريات جديدة - المورد: ${supplierName} - المبلغ: ${purchasesBeforeTax} ريال`,
        actionType: 'add_purchases',
        actionStatus: 'success',
        actionAmount: purchasesBeforeTax,
        actionNotes: `مشتريات من المورد ${supplierName} - المبلغ قبل الضريبة: ${purchasesBeforeTax}، نسبة الضريبة: ${taxRate}، المبلغ الإجمالي: ${purchasesIncludingTax}${invoiceNumber ? ` - رقم الفاتورة: ${invoiceNumber}` : ''}`,
      });

      return res.status(201).json({ success: true, purchaseTax });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('TaxPurchaseRecord API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

