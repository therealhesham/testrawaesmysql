import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../globalprisma";
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format, searchTerm, action, userName } = req.query;
    
    if (!format || (format !== 'pdf' && format !== 'excel')) {
      return res.status(400).json({ error: 'Format must be "pdf" or "excel"' });
    }

    // Build where clause (same logic as systemlogs.ts)
    let where: any = {};

    if (searchTerm || action) {
      const filters: any[] = [];

      if (searchTerm) {
        filters.push({
          OR: [
            { action: { contains: searchTerm as string, mode: 'insensitive' } },
            { user: { username: { contains: searchTerm as string, mode: 'insensitive' } } },
          ],
        });
      }

      if (action) {
        filters.push({ actionType: action as string });
      }

      where = filters.length === 1 ? filters[0] : { AND: filters };
    }

    // Fetch all logs for export
    const logs = await prisma.systemUserLogs.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: { 
        user: {
          select: {
            username: true,
            email: true,
          }
        } 
      },
    });

    if (logs.length === 0) {
      return res.status(404).json({ error: 'لا توجد بيانات للتصدير' });
    }

    if (format === 'excel') {
      return await exportToExcel(logs, res, userName as string);
    } else if (format === 'pdf') {
      return await exportToPDF(logs, res, userName as string);
    }
  } catch (error) {
    console.error('Error exporting system logs:', error);
    return res.status(500).json({ 
      error: 'Error exporting logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function exportToExcel(logs: any[], res: NextApiResponse, userName: string) {
  try {
    const worksheetData = logs.map((row) => ({
      'رقم السجل': row.id || 'غير متوفر',
      'الإجراء': row.action || 'غير متوفر',
      'تاريخ الإنشاء': row.createdAt ? new Date(row.createdAt).toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
      }) : 'غير متوفر',
      'وقت الإنشاء': row.createdAt ? new Date(row.createdAt).toLocaleTimeString('ar-EG', { 
        hour: '2-digit',
        minute: '2-digit'
      }) : 'غير متوفر',
      'اسم المستخدم': row.user?.username || 'غير متوفر',
      'الصفحة': row.pageRoute || 'غير متوفر',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
      header: ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'وقت الإنشاء', 'اسم المستخدم', 'الصفحة'],
    });
    
    // تحسين عرض الأعمدة
    const colWidths = [
      { wch: 15 }, // رقم السجل
      { wch: 30 }, // الإجراء
      { wch: 20 }, // تاريخ الإنشاء
      { wch: 15 }, // وقت الإنشاء
      { wch: 20 }, // اسم المستخدم
      { wch: 30 }, // الصفحة
    ];
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل النظام');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to export to Excel' });
  }
}

async function exportToPDF(logs: any[], res: NextApiResponse, userName: string) {
  try {
    const doc = new PDFDocument({ 
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    // Set response headers
    const fileName = `سجل_النظام_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(16).text('سجل النظام', { align: 'right' });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const rowHeight = 20;
    const colWidths = [80, 120, 80, 80, 100, 120];
    const headers = ['رقم السجل', 'الإجراء', 'تاريخ الإنشاء', 'وقت الإنشاء', 'اسم المستخدم', 'الصفحة'];
    
    let x = doc.page.width - doc.page.margins.right;
    
    // Draw header row
    doc.fontSize(10).fillColor('white');
    headers.forEach((header, i) => {
      const colX = x - colWidths.slice(i).reduce((a, b) => a + b, 0);
      doc.rect(colX, tableTop, colWidths[i], rowHeight).fillAndStroke('#00695c', '#00695c');
      doc.fillColor('white').text(header, colX + 5, tableTop + 5, { width: colWidths[i] - 10, align: 'right' });
    });

    // Draw data rows
    doc.fillColor('black');
    let currentY = tableTop + rowHeight;
    
    logs.forEach((log, index) => {
      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.page.margins.top;
        
        // Redraw headers on new page
        headers.forEach((header, i) => {
          const colX = x - colWidths.slice(i).reduce((a, b) => a + b, 0);
          doc.fillColor('#00695c').rect(colX, currentY, colWidths[i], rowHeight).fill();
          doc.fillColor('white').text(header, colX + 5, currentY + 5, { width: colWidths[i] - 10, align: 'right' });
        });
        currentY += rowHeight;
        doc.fillColor('black');
      }

      const rowData = [
        String(log.id || 'غير متوفر'),
        log.action || 'غير متوفر',
        log.createdAt ? new Date(log.createdAt).toLocaleDateString('ar-EG', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit'
        }) : 'غير متوفر',
        log.createdAt ? new Date(log.createdAt).toLocaleTimeString('ar-EG', { 
          hour: '2-digit',
          minute: '2-digit'
        }) : 'غير متوفر',
        log.user?.username || 'غير متوفر',
        log.pageRoute || 'غير متوفر',
      ];

      // Alternate row colors
      if (index % 2 === 0) {
        headers.forEach((_, i) => {
          const colX = x - colWidths.slice(i).reduce((a, b) => a + b, 0);
          doc.fillColor('#f5f5f5').rect(colX, currentY, colWidths[i], rowHeight).fill();
        });
      }

      // Draw cell borders and text
      headers.forEach((_, i) => {
        const colX = x - colWidths.slice(i).reduce((a, b) => a + b, 0);
        doc.rect(colX, currentY, colWidths[i], rowHeight).stroke();
        doc.fillColor('black').text(rowData[i], colX + 5, currentY + 5, { 
          width: colWidths[i] - 10, 
          align: 'right' 
        });
      });

      currentY += rowHeight;
    });

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('gray');
      doc.text(
        userName || 'مستخدم',
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom + 10,
        { align: 'left' }
      );
      doc.text(
        `صفحة ${i + 1}`,
        doc.page.width / 2,
        doc.page.height - doc.page.margins.bottom + 10,
        { align: 'center' }
      );
      doc.text(
        `التاريخ: ${new Date().toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })} الساعة: ${new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        doc.page.width - doc.page.margins.right,
        doc.page.height - doc.page.margins.bottom + 10,
        { align: 'right' }
      );
    }

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to export to PDF' });
    }
  }
}

