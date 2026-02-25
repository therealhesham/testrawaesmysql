import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { from, to } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) dateFilter.date.gte = new Date(String(from));
      if (to) dateFilter.date.lte = new Date(String(to));
    }

    // Fetch all sales records (Output Tax)
    const salesRecords = await prisma.taxSalesRecord.findMany({
      where: dateFilter,
      include: {
        customer: {
          select: {
            id: true,
            fullname: true,
          },
        },
      },
    });

    // Fetch all purchase records (Input Tax)
    const purchaseRecords = await prisma.taxPurchaseRecord.findMany({
      where: dateFilter,
    });

    // Helper function to convert Decimal to number
    const toNumber = (value: any): number => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value) || 0;
      if (value instanceof Prisma.Decimal) return value.toNumber();
      return 0;
    };

    // Calculate Sales Tax (Output Tax) grouped by categories
    const salesTax15 = salesRecords.filter(s => {
      const rate = toNumber(s.taxRate);
      return rate === 15 || rate === 0.15;
    });
    const salesTax15Amount = salesTax15.reduce((sum, s) => sum + toNumber(s.salesBeforeTax || s.amount), 0);
    const salesTax15Adjustment = salesTax15.reduce((sum, s) => sum + toNumber(s.adjustment), 0);
    const salesTax15VAT = salesTax15.reduce((sum, s) => sum + toNumber(s.taxValue || 0), 0);

    // Zero rate sales (internal)
    const zeroRateSales = salesRecords.filter(s => {
      const rate = toNumber(s.taxRate);
      return rate === 0;
    });
    const zeroRateAmount = zeroRateSales.reduce((sum, s) => sum + toNumber(s.salesBeforeTax || s.amount), 0);
    const zeroRateAdjustment = zeroRateSales.reduce((sum, s) => sum + toNumber(s.adjustment), 0);
    const zeroRateVAT = zeroRateSales.reduce((sum, s) => sum + toNumber(s.taxValue || 0), 0);

    // Citizen services (healthcare, education, first home) - exempt
    const citizenServicesSales = salesRecords.filter(s => {
      if (!s.description && !s.category) return false;
      const text = `${s.description || ''} ${s.category || ''}`.toLowerCase();
      return text.includes('صحية') || text.includes('صحة') || 
             text.includes('تعليم') || text.includes('مدرسة') || 
             text.includes('مسكن') || text.includes('سكن أول') ||
             text.includes('healthcare') || text.includes('education') || 
             text.includes('first home');
    });
    const citizenServicesAmount = citizenServicesSales.reduce((sum, s) => sum + toNumber(s.salesBeforeTax || s.amount), 0);

    // Export sales
    const exportSales = salesRecords.filter(s => {
      if (!s.description && !s.category && !s.customerName) return false;
      const text = `${s.description || ''} ${s.category || ''} ${s.customerName || ''}`.toLowerCase();
      return text.includes('تصدير') || text.includes('صادرات') || 
             text.includes('export') || text.includes('international');
    });
    const exportAmount = exportSales.reduce((sum, s) => sum + toNumber(s.salesBeforeTax || s.amount), 0);

    // Cancelled sales (negative adjustments)
    const cancelledSales = salesRecords.filter(s => {
      const adj = toNumber(s.adjustment);
      return adj < 0 || (s.category && s.category.toLowerCase().includes('ملغاة'));
    });
    const cancelledAmount = cancelledSales.reduce((sum, s) => sum + Math.abs(toNumber(s.salesBeforeTax || s.amount)), 0);
    const cancelledAdjustment = cancelledSales.reduce((sum, s) => sum + Math.abs(toNumber(s.adjustment)), 0);
    const cancelledVAT = cancelledSales.reduce((sum, s) => sum + Math.abs(toNumber(s.taxValue || 0)), 0);

    // Calculate total sales tax (Output Tax)
    const totalSalesTaxAmount = salesRecords.reduce((sum, s) => sum + toNumber(s.salesBeforeTax || s.amount), 0);
    const totalSalesTaxAdjustment = salesRecords.reduce((sum, s) => sum + toNumber(s.adjustment), 0);
    const totalSalesTaxVAT = salesRecords.reduce((sum, s) => sum + toNumber(s.taxValue || 0), 0);

    // Calculate Input Tax grouped by categories
    const purchasesTax15 = purchaseRecords.filter(p => {
      const rate = toNumber(p.taxRate);
      return rate === 15 || rate === 0.15;
    });
    const purchasesTax15Amount = purchasesTax15.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const purchasesTax15Adjustment = purchasesTax15.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const purchasesTax15VAT = purchasesTax15.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Customs paid VAT
    const customsPurchases = purchaseRecords.filter(p => {
      return p.supplyType && (
        p.supplyType.includes('جمارك') || 
        p.supplyType.includes('استيراد') ||
        p.category?.includes('جمارك')
      );
    });
    const customsAmount = customsPurchases.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const customsAdjustment = customsPurchases.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const customsVAT = customsPurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Reverse charge imports
    const reverseChargePurchases = purchaseRecords.filter(p => {
      return p.supplyType && (
        p.supplyType.includes('احتساب عكسي') ||
        p.supplyType.includes('reverse') ||
        p.category?.includes('احتساب عكسي')
      );
    });
    const reverseChargeAmount = reverseChargePurchases.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const reverseChargeAdjustment = reverseChargePurchases.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const reverseChargeVAT = reverseChargePurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Zero rate purchases
    const zeroRatePurchases = purchaseRecords.filter(p => {
      const rate = toNumber(p.taxRate);
      return rate === 0;
    });
    const zeroRatePurchasesAmount = zeroRatePurchases.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const zeroRatePurchasesAdjustment = zeroRatePurchases.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const zeroRatePurchasesVAT = zeroRatePurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Exempt purchases
    const exemptPurchases = purchaseRecords.filter(p => {
      return p.category && (
        p.category.includes('معفاة') ||
        p.category.includes('exempt')
      );
    });
    const exemptAmount = exemptPurchases.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const exemptAdjustment = exemptPurchases.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const exemptVAT = exemptPurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Calculate total input tax
    const totalInputTaxAmount = purchaseRecords.reduce((sum, p) => sum + toNumber(p.purchasesBeforeTax || p.amount), 0);
    const totalInputTaxAdjustment = purchaseRecords.reduce((sum, p) => sum + toNumber(p.adjustment), 0);
    const totalInputTaxVAT = purchaseRecords.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

    // Calculate VAT Summary
    const totalOutputTax = totalSalesTaxVAT;
    const totalInputTax = totalInputTaxVAT;
    const netVAT = totalOutputTax - totalInputTax;

    // Format numbers
    const formatNumber = (num: number): string => {
      if (num === 0) return '-';
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // Build response structure matching the table format
    const response = {
      success: true,
      sales: {
        title: 'المبيعات',
        rows: [
          {
            description: 'المبيعات الخاضعة للنسبة الاساسية (15%)',
            amount: formatNumber(salesTax15Amount),
            adjustment: formatNumber(salesTax15Adjustment),
            vat: formatNumber(salesTax15VAT),
          },
          {
            description: 'المبيعات لصالح المواطنين(خدمات صحية خاصة،التعليم الاهلي الخاص، المسكن الاول)',
            amount: formatNumber(citizenServicesAmount),
            adjustment: '-',
            vat: '-',
          },
          {
            description: 'المبيعات الداخلية الخاضعة لنسبة صفر بالمائة',
            amount: formatNumber(zeroRateAmount - exportAmount), // Subtract exports from zero rate
            adjustment: formatNumber(zeroRateAdjustment),
            vat: formatNumber(zeroRateVAT),
          },
          {
            description: 'الصادرات الخاضعة لنسبة صفر بالمائة',
            amount: formatNumber(exportAmount),
            adjustment: '-',
            vat: '-',
          },
          {
            description: 'المبيعات الملغاة',
            amount: formatNumber(cancelledAmount),
            adjustment: formatNumber(cancelledAdjustment),
            vat: formatNumber(cancelledVAT),
          },
        ],
        total: {
          amount: formatNumber(totalSalesTaxAmount),
          adjustment: formatNumber(totalSalesTaxAdjustment),
          vat: formatNumber(totalSalesTaxVAT),
        },
      },
      purchases: {
        title: 'المشتريات',
        rows: [
          {
            description: 'المشتريات الداخلية الخاضعة للنسبة الاساسية(15%)',
            amount: formatNumber(purchasesTax15Amount),
            adjustment: formatNumber(purchasesTax15Adjustment),
            vat: formatNumber(purchasesTax15VAT),
          },
          {
            description: 'التوريدات الخاضعة للضريبة القيمة المضافة المسددة للجمارك',
            amount: formatNumber(customsAmount),
            adjustment: formatNumber(customsAdjustment),
            vat: formatNumber(customsVAT),
          },
          {
            description: 'عمليات الاستيراد الخاضعة لضريبة القيمة المضافة والمستحقة للضريبة وفقا لالية الاحتساب العكسي',
            amount: formatNumber(reverseChargeAmount),
            adjustment: formatNumber(reverseChargeAdjustment),
            vat: formatNumber(reverseChargeVAT),
          },
          {
            description: 'المشتريات الخاضعة لنسبة صفر بالمائة',
            amount: formatNumber(zeroRatePurchasesAmount),
            adjustment: formatNumber(zeroRatePurchasesAdjustment),
            vat: formatNumber(zeroRatePurchasesVAT),
          },
          {
            description: 'المبيعات المعفاة',
            amount: formatNumber(exemptAmount),
            adjustment: formatNumber(exemptAdjustment),
            vat: formatNumber(exemptVAT),
          },
        ],
        total: {
          amount: formatNumber(totalInputTaxAmount),
          adjustment: formatNumber(totalInputTaxAdjustment),
          vat: formatNumber(totalInputTaxVAT),
        },
      },
      vat: {
        title: 'الضريبة المضافة',
        rows: [
          {
            description: 'تصحيحات الفترة السابقة',
            amount: '-',
            adjustment: '-',
            vat: '-',
          },
          {
            description: 'ضريبة القيمة المضافة المرحلة من الفترات السابقة',
            amount: '-',
            adjustment: '-',
            vat: '-',
          },
        ],
        total: {
          description: 'صافي ضريبة القيمة المضافة المستحقة للدفع',
          amount: formatNumber(totalSalesTaxAmount - totalInputTaxAmount),
          adjustment: formatNumber(totalSalesTaxAdjustment - totalInputTaxAdjustment),
          vat: formatNumber(netVAT),
        },
      },
      summary: {
        taxableSales: totalSalesTaxAmount,
        zeroRateSales: zeroRateAmount,
        adjustments: totalSalesTaxAdjustment - totalInputTaxAdjustment,
        taxValue: netVAT,
        outputTax: totalOutputTax,
        inputTax: totalInputTaxVAT,
      },
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('VAT Summary API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

