import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

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
        supplierName,
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
      } = req.body;

      // Validate required fields
      if (!supplierName || !date || !purchasesBeforeTax || !taxRate) {
        return res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: اسم المورد، التاريخ، قيمة المشتريات قبل الضريبة، ونسبة الضريبة',
        });
      }

      // Create purchase tax record using TaxPurchaseRecord model
      const purchaseTax = await prisma.taxPurchaseRecord.create({
        data: {
          supplierName: String(supplierName),
          date: new Date(date),
          status: status ? String(status) : 'مدفوعة',
          invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
          supplyType: supplyType ? String(supplyType) : null,
          purchasesBeforeTax: new Prisma.Decimal(purchasesBeforeTax),
          taxRate: new Prisma.Decimal(taxRate),
          taxValue: new Prisma.Decimal(taxValue || 0),
          purchasesIncludingTax: new Prisma.Decimal(purchasesIncludingTax || 0),
          attachment: null, // File upload will be handled separately if needed
          amount: new Prisma.Decimal(amount || purchasesBeforeTax),
          total: new Prisma.Decimal(total || purchasesIncludingTax),
          // taxDeclarationId is optional, can be set later if needed
          taxDeclarationId: undefined,
        } as any, // Type assertion until prisma generate is run
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

