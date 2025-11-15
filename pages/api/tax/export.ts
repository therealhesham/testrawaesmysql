import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { format, year, month } = req.query;
    
    const where: any = {};
    if (year) where.year = parseInt(year as string);
    if (month) where.month = parseInt(month as string);

    const declaration = await prisma.taxDeclaration.findFirst({
      where,
      include: {
        salesRecords: true,
        purchaseRecords: true,
        vatRecords: true,
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (!declaration) {
      return res.status(404).json({ message: 'No tax declaration found for the specified period' });
    }

    if (format === 'excel') {
      return await exportToExcel(declaration, res);
    } else if (format === 'pdf') {
      return await exportToPDF(declaration, res);
    } else {
      return res.status(400).json({ message: 'Invalid format. Use "excel" or "pdf"' });
    }
  } catch (error) {
    console.error('Tax export API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function exportToExcel(declaration: any, res: NextApiResponse) {
  try {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['المبيعات الخاضعة للضريبة', declaration.taxableSales],
      ['المبيعات الخاضعة للصفر', declaration.zeroRateSales],
      ['التعديلات', declaration.adjustments],
      ['قيمة الضريبة', declaration.taxValue],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص');

    // Sales sheet
    const salesData = [
      ['فئة المبيعات', 'الوصف', 'المبلغ', 'التعديل', 'الإجمالي', 'نسبة الضريبة'],
      ...declaration.salesRecords.map((record: any) => [
        record.category,
        record.description,
        record.amount,
        record.adjustment,
        record.total,
        record.taxRate,
      ]),
    ];
    const salesSheet = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(workbook, salesSheet, 'المبيعات');

    // Purchases sheet
    const purchasesData = [
      ['فئة المشتريات', 'الوصف', 'المبلغ', 'التعديل', 'الإجمالي', 'نسبة الضريبة'],
      ...declaration.purchaseRecords.map((record: any) => [
        record.category,
        record.description,
        record.amount,
        record.adjustment,
        record.total,
        record.taxRate,
      ]),
    ];
    const purchasesSheet = XLSX.utils.aoa_to_sheet(purchasesData);
    XLSX.utils.book_append_sheet(workbook, purchasesSheet, 'المشتريات');

    // VAT sheet
    const vatData = [
      ['فئة ضريبة القيمة المضافة', 'الوصف', 'المبلغ', 'التعديل', 'الإجمالي'],
      ...declaration.vatRecords.map((record: any) => [
        record.category,
        record.description,
        record.amount,
        record.adjustment,
        record.total,
      ]),
    ];
    const vatSheet = XLSX.utils.aoa_to_sheet(vatData);
    XLSX.utils.book_append_sheet(workbook, vatSheet, 'الضريبة المضافة');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tax-declaration-${declaration.year}-${declaration.month}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to export to Excel' });
  }
}

async function exportToPDF(declaration: any, res: NextApiResponse) {
  try {
    // For PDF export, we'll return a JSON response with the data
    // The frontend can use a PDF library like jsPDF to generate the PDF
    const pdfData = {
      declaration,
      generatedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tax-declaration-${declaration.year}-${declaration.month}.json"`);
    res.json(pdfData);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to export to PDF' });
  }
}
