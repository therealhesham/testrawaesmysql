import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

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

      // Update purchase tax record
      const purchaseTax = await prisma.taxPurchaseRecord.update({
        where: { id: parseInt(id) },
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
          amount: new Prisma.Decimal(amount || purchasesBeforeTax),
          total: new Prisma.Decimal(total || purchasesIncludingTax),
        } as any,
      });

      return res.status(200).json({ success: true, purchaseTax });
    }

    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (error: any) {
    console.error('TaxPurchaseRecord update error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

