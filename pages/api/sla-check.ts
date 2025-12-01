import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import { differenceInCalendarDays } from 'date-fns';
// @ts-ignore
import nodemailer from 'nodemailer';

type SlaRule = { id: number; officeName: string; stage: string; days: number };

async function loadRules(): Promise<SlaRule[]> {
  const rules = await prisma.officeSlaRule.findMany();
  return rules as unknown as SlaRule[];
}

function isStageCompleted(stage: string, rec: any): boolean {
  switch (stage) {
    case 'medicalCheck':
      return Boolean(rec.medicalCheckDate);
    case 'foreignLaborApproval':
      return Boolean(rec.foreignLaborApproval);
    case 'saudiEmbassyApproval':
      return Boolean(rec.EmbassySealing);
    case 'visaIssuance':
      return Boolean(rec.visaNumber);
    case 'travelPermit':
      return Boolean(rec.travelPermit);
    default:
      return false;
  }
}
// Determine the start date based on the previous stage completion
function getStartDateForStage(stage: string, rec: any): Date | null {
  // Mapping: previous stage completion date fields available in arrivallist
  // 3- externalOfficeApproval -> ExternalOFficeApproval (DateTime?)
  // 4- medicalCheck -> starts from ExternalOFficeApproval
  // 5- foreignLaborApproval -> starts from medicalCheckDate
  // 6- saudiEmbassyApproval -> starts from foreignLaborApprovalDate
  // 7- visaIssuance -> starts from EmbassySealing
  // 8- travelPermit -> starts from visaIssuanceDate

  switch (stage) {
    case 'medicalCheck':
      return rec.ExternalOFficeApproval || rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
    case 'foreignLaborApproval':
      return rec.medicalCheckDate || rec.ExternalOFficeApproval || rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
    case 'saudiEmbassyApproval':
      return rec.foreignLaborApprovalDate || rec.ExternalOFficeApproval || rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
    case 'visaIssuance':
      return rec.EmbassySealing || rec.foreignLaborApprovalDate || rec.ExternalOFficeApproval || rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
    case 'travelPermit':
      return rec.visaIssuanceDate || rec.EmbassySealing || rec.foreignLaborApprovalDate || rec.ExternalOFficeApproval || rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
    default:
      return rec.ExternalDateLinking || rec.DateOfApplication || rec.DayDate || null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` });
    }

    const rules = await loadRules();
    console.log("rules", rules.length);
    if (rules.length === 0) return res.status(200).json({ success: true, generated: 0 });

    // fetch relevant arrivals joined with order and office name
    const arrivals = await prisma.arrivallist.findMany({
      select: {
        id: true,
        OrderId: true,
        office: true,
        externalOfficeStatus: true,
        ExternalOFficeApproval: true,
        ExternalDateLinking: true,
        DateOfApplication: true,
        DayDate: true,
        medicalCheckFile: true,
        medicalCheckDate: true,
        foreignLaborApproval: true,
        foreignLaborApprovalDate: true,
        EmbassySealing: true,
        visaNumber: true,
        visaIssuanceDate: true,
        travelPermit: true,
        Order: {
          select: {
            id: true,
            Name: true,
            HomeMaid: {
              select: {
                Name: true,
                office: {
                  select: {
                    office: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group delayed orders by office
    const officeDelays: { [officeName: string]: { email?: string; orders: Array<{ orderId: number; workerName: string; stage: string; daysOverdue: number }> } } = {};

    let generated = 0;
    for (const rule of rules) {
      const relevant = arrivals.filter((a) => (a.Order?.HomeMaid?.office?.office || '').trim() === rule.officeName.trim());
      console.log("relevant", relevant.length);
      
      for (const rec of relevant) {
        if (isStageCompleted(rule.stage, rec)) continue;
        const start = getStartDateForStage(rule.stage, rec);
        if (!start) continue;
        const daysDiff = differenceInCalendarDays(new Date(), new Date(start));
        console.log(`  Order #${rec.OrderId}: Days diff = ${daysDiff}, Limit = ${rule.days}`);
        
        if (daysDiff > rule.days) {
          // Create notification
          await prisma.notifications.create({
            data: {
              title: 'تأخير مرحلة',
              message: `تأخير في مرحلة ${rule.stage} للطلب #${rec.OrderId} (المكتب: ${rule.officeName})` ,
              isRead: false,
            },
          });
          generated += 1;

          // Add to office delays for email
          if (!officeDelays[rule.officeName]) {
            officeDelays[rule.officeName] = { orders: [] };
          }
          
          const workerName = rec.Order?.HomeMaid?.Name || rec.Order?.Name || 'غير محدد';
          officeDelays[rule.officeName].orders.push({
            orderId: rec.OrderId || 0,
            workerName: workerName,
            stage: rule.stage,
            daysOverdue: daysDiff - rule.days,
          });
        }
      }
    }

    // Send emails to offices
    if (Object.keys(officeDelays).length > 0) {
      // Get office emails
      const offices = await prisma.offices.findMany({
        where: {
          office: { in: Object.keys(officeDelays) },
        },
      });

      // Map emails to offices (using any to access email field if it exists in DB but not in schema)
      offices.forEach((office: any) => {
        if (officeDelays[office.office || '']) {
          officeDelays[office.office || ''].email = office.email || undefined;
        }
      });

      // Setup email transporter
      const transporter = nodemailer.createTransport({
        host: 'mail.rawaes.com',
        port: 465,
        secure: true,
        auth: {
          user: 'hrdoc@rawaes.com',
          pass: 'a-f09JRnpZOk',
        },
      });

      // Send email to each office
      for (const [officeName, data] of Object.entries(officeDelays)) {
        if (!data.email || data.orders.length === 0) {
          console.log(`No email found for office: ${officeName}`);
          continue;
        }

        // Generate email HTML
        const stageLabels: { [key: string]: string } = {
          medicalCheck: 'كشف طبي',
          foreignLaborApproval: 'موافقة وزارة العمل الأجنبية',
          saudiEmbassyApproval: 'موافقة السفارة السعودية',
          visaIssuance: 'إصدار التأشيرة',
          travelPermit: 'تصريح السفر',
        };

        const tableRows = data.orders.map((order, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
            <td style="padding: 16px 20px; border: 1px solid #dee2e6; text-align: right; font-size: 15px; color: #333;">${order.workerName}</td>
            <td style="padding: 16px 20px; border: 1px solid #dee2e6; text-align: right; font-size: 15px; color: #115e59; font-weight: bold;">#${order.orderId}</td>
            <td style="padding: 16px 20px; border: 1px solid #dee2e6; text-align: right; font-size: 15px; color: #333;">${stageLabels[order.stage] || order.stage}</td>
            <td style="padding: 16px 20px; border: 1px solid #dee2e6; text-align: right; font-size: 15px; color: #dc2626; font-weight: bold;">${order.daysOverdue} يوم</td>
          </tr>
        `).join('');

        const emailHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تنبيه تأخير مراحل</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .table-responsive { overflow-x: auto; }
    }
    
    /* Print Styles */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      
      .container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      
      .header-section {
        page-break-inside: avoid;
        background: #115e59 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .content-section {
        page-break-inside: avoid;
      }
      
      .table-container {
        page-break-inside: auto;
        overflow: visible !important;
      }
      
      table {
        page-break-inside: auto;
        border-collapse: collapse !important;
      }
      
      thead {
        display: table-header-group;
        background: #115e59 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      tbody {
        display: table-row-group;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      th, td {
        border: 1px solid #000 !important;
        padding: 12px 15px !important;
      }
      
      th {
        background: #115e59 !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .footer-section {
        page-break-inside: avoid;
      }
      
      img {
        max-width: 150px !important;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* Screen Styles */
    @media screen {
      .print-only {
        display: none;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', 'Tahoma', sans-serif; background-color: #f5f5f5; direction: rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="container" style="max-width: 100%; width: 100%; background-color: #ffffff; margin: 0;">
          <!-- Header with Logo -->
          <tr>
            <td class="header-section" style="background: linear-gradient(135deg, #115e59 0%, #0f766e 100%); padding: 30px 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: left; vertical-align: middle;">
                    <img src="https://wasl.rawaes.com/coloredlogo.png" alt="روائس" style="max-width: 180px; height: auto; display: block;">
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">تنبيه تأخير مراحل</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content-section" style="padding: 40px;">
              <p style="color: #333333; font-size: 18px; line-height: 1.8; margin: 0 0 30px; text-align: right;">
                مرحبًا،<br>
                يوجد <strong style="color: #dc2626; font-size: 20px;">${data.orders.length}</strong> طلب/طلبات متأخرة في مراحل المعالجة. يرجى مراجعة التفاصيل أدناه والمتابعة.
              </p>
              
              <!-- Print Date -->
              <div class="print-only" style="text-align: left; margin-bottom: 20px; padding: 10px; background-color: #f0f0f0; border: 1px solid #ddd;">
                <p style="margin: 0; font-size: 12px; color: #666;">
                  تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <!-- Table Container -->
              <div class="table-container table-responsive" style="overflow-x: auto; margin: 30px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <thead>
                    <tr>
                      <th style="background-color: #115e59; color: #ffffff; padding: 18px 20px; font-size: 16px; font-weight: bold; text-align: right; border: 1px solid #0d4f4a; -webkit-print-color-adjust: exact; print-color-adjust: exact;">اسم العامل</th>
                      <th style="background-color: #115e59; color: #ffffff; padding: 18px 20px; font-size: 16px; font-weight: bold; text-align: right; border: 1px solid #0d4f4a; -webkit-print-color-adjust: exact; print-color-adjust: exact;">رقم الطلب</th>
                      <th style="background-color: #115e59; color: #ffffff; padding: 18px 20px; font-size: 16px; font-weight: bold; text-align: right; border: 1px solid #0d4f4a; -webkit-print-color-adjust: exact; print-color-adjust: exact;">المرحلة</th>
                      <th style="background-color: #115e59; color: #ffffff; padding: 18px 20px; font-size: 16px; font-weight: bold; text-align: right; border: 1px solid #0d4f4a; -webkit-print-color-adjust: exact; print-color-adjust: exact;">التأخير</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin-top: 30px; border-right: 4px solid #115e59;">
                <p style="color: #666666; font-size: 16px; line-height: 1.8; margin: 0; text-align: right;">
                  <strong style="color: #115e59;">شكرًا لكم،</strong><br>
                  <span style="color: #888;">فريق إدارة روائس</span>
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer-section" style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                © ${new Date().getFullYear()} روائس - جميع الحقوق محفوظة
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        try {
          await transporter.sendMail({
            from: 'hrdoc@rawaes.com',
            to: data.email,
            subject: `تنبيه تأخير مراحل - ${officeName}`,
            html: emailHTML,
          });
          console.log(`Email sent successfully to ${officeName}: ${data.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${officeName}:`, emailError);
        }
      }
    }

    return res.status(200).json({ success: true, generated });
  } catch (e) {
    console.error('sla-check error', e);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    await prisma.$disconnect();
  }
}


