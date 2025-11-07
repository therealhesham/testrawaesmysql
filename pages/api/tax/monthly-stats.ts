import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { year } = req.query;

    // Default to current year if not specified
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    
    // Build date filter for the entire year
    const dateFilter: any = {
      date: {
        gte: new Date(currentYear, 0, 1),
        lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
      },
    };

    // Fetch all sales records (Output Tax)
    const salesRecords = await prisma.taxSalesRecord.findMany({
      where: dateFilter,
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

    // Arabic month names
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    // Calculate monthly data
    const monthlyData = monthNames.map((monthName, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = new Date(currentYear, index + 1, 0, 23, 59, 59, 999);

      // Filter sales records for this month
      const monthSales = salesRecords.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      // Filter purchase records for this month
      const monthPurchases = purchaseRecords.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });

      // Calculate total sales tax (Output Tax) - اجمالي ضريبة المبيعات
      const totalSalesTax = monthSales.reduce((sum, s) => sum + toNumber(s.taxValue || 0), 0);

      // Calculate total purchase tax (Input Tax) - اجمالي ضريبة المشتريات
      const totalPurchaseTax = monthPurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

      // Calculate net due tax (Output Tax - Input Tax) - اجمالي الضريبة المستحقة
      const netDueTax = totalSalesTax - totalPurchaseTax;

      return {
        month: monthName,
        monthNumber: index + 1,
        totalSalesTax: totalSalesTax,
        totalPurchaseTax: totalPurchaseTax,
        netDueTax: netDueTax,
      };
    });

    return res.status(200).json({
      success: true,
      year: currentYear,
      monthlyData,
    });
  } catch (error: any) {
    console.error('Monthly Tax Stats API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

