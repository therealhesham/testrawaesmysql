import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { Prisma } from '@prisma/client';
import { subDays, eachMonthOfInterval, format } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { period, startDate, endDate, year, monthSelection } = req.method === 'POST' ? req.body : req.query;
    
    // تحديد نطاق التاريخ
    let dateFilter: { gte?: Date; lte?: Date } = {};
    let periodsToProcess: { month: number; monthName: string; start: Date; end: Date }[] = [];
    const now = new Date();

    // Arabic month names
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    if (period === 'week') {
      dateFilter.gte = subDays(now, 7);
      dateFilter.lte = now;
      // بيانات يومية للأسبوع
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(subDays(now, i));
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        days.push({
          month: day.getMonth() + 1,
          monthName: format(day, 'd/M'),
          start,
          end,
        });
      }
      periodsToProcess = days;
    } else if (period === 'month') {
      let targetMonth: Date;
      if (monthSelection === 'previous') {
        // الشهر السابق
        targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        // الشهر الحالي (افتراضي)
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      dateFilter.gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      dateFilter.lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
      periodsToProcess = [{
        month: targetMonth.getMonth() + 1,
        monthName: monthNames[targetMonth.getMonth()],
        start: dateFilter.gte,
        end: dateFilter.lte,
      }];
    } else if (period === 'custom' && startDate && endDate) {
      dateFilter.gte = new Date(startDate as string);
      dateFilter.lte = new Date(endDate as string);
      const months = eachMonthOfInterval({ start: dateFilter.gte, end: dateFilter.lte });
      periodsToProcess = months.map((month, i) => {
        const start = i === 0 ? dateFilter.gte! : new Date(month.getFullYear(), month.getMonth(), 1);
        const end = i === months.length - 1 
          ? dateFilter.lte! 
          : new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          month: month.getMonth() + 1,
          monthName: monthNames[month.getMonth()],
          start,
          end,
        };
      });
    } else {
      // السنة الحالية (افتراضي)
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
      dateFilter.gte = new Date(currentYear, 0, 1);
      dateFilter.lte = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      
      periodsToProcess = monthNames.map((monthName, index) => {
        const month = index + 1;
        return {
          month,
          monthName,
          start: new Date(currentYear, month - 1, 1),
          end: new Date(currentYear, month, 0, 23, 59, 59, 999),
        };
      });
    }
    
    // Build date filter for query
    const queryDateFilter: any = {
      date: {
        gte: dateFilter.gte,
        lte: dateFilter.lte,
      },
    };

    // Fetch all sales records (Output Tax) within the date range
    const salesRecords = await prisma.taxSalesRecord.findMany({
      where: queryDateFilter,
    });

    // Fetch all purchase records (Input Tax) within the date range
    const purchaseRecords = await prisma.taxPurchaseRecord.findMany({
      where: queryDateFilter,
    });

    // Helper function to convert Decimal to number
    const toNumber = (value: any): number => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') return parseFloat(value) || 0;
      if (value instanceof Prisma.Decimal) return value.toNumber();
      return 0;
    };

    // Calculate monthly data
    const monthlyData = periodsToProcess.map((periodData) => {
      // Filter sales records for this period
      const periodSales = salesRecords.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= periodData.start && saleDate <= periodData.end;
      });

      // Filter purchase records for this period
      const periodPurchases = purchaseRecords.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return purchaseDate >= periodData.start && purchaseDate <= periodData.end;
      });

      // Calculate total sales tax (Output Tax) - اجمالي ضريبة المبيعات
      const totalSalesTax = periodSales.reduce((sum, s) => sum + toNumber(s.taxValue || 0), 0);

      // Calculate total purchase tax (Input Tax) - اجمالي ضريبة المشتريات
      const totalPurchaseTax = periodPurchases.reduce((sum, p) => sum + toNumber(p.taxValue || 0), 0);

      // Calculate net due tax (Output Tax - Input Tax) - اجمالي الضريبة المستحقة
      const netDueTax = totalSalesTax - totalPurchaseTax;

      return {
        month: periodData.monthName,
        monthNumber: periodData.month,
        totalSalesTax: totalSalesTax,
        totalPurchaseTax: totalPurchaseTax,
        netDueTax: netDueTax,
      };
    });

    return res.status(200).json({
      success: true,
      period: period || 'year',
      dateRange: dateFilter,
      year: periodsToProcess.length > 0 ? periodsToProcess[0].start.getFullYear() : new Date().getFullYear(),
      monthlyData,
    });
  } catch (error: any) {
    console.error('Monthly Tax Stats API error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

