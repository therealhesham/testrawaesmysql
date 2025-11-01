import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import { differenceInCalendarDays } from 'date-fns';

type SlaRule = { id: number; officeName: string; stage: string; days: number };

async function loadRules(): Promise<SlaRule[]> {
  const rules = await (prisma as any).officeSlaRule.findMany();
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
    if (rules.length === 0) return res.status(200).json({ success: true, generated: 0 });

    // fetch relevant arrivals joined with order and office name
    const arrivals = await prisma.arrivallist.findMany({
      select: {
        id: true,
        OrderId: true,
        office: true,
        ExternalDateLinking: true,
        DateOfApplication: true,
        DayDate: true,
        medicalCheckFile: true,
        foreignLaborApproval: true,
        foreignLaborApprovalDate: true,
        EmbassySealing: true,
        visaNumber: true,
        travelPermit: true,
      },
    });

    let generated = 0;
    for (const rule of rules) {
      const relevant = arrivals.filter((a) => (a.office || '').trim() === rule.officeName.trim());
      for (const rec of relevant) {
        if (isStageCompleted(rule.stage, rec)) continue;
        const start = getStartDateForStage(rule.stage, rec);
        if (!start) continue;
        const daysDiff = differenceInCalendarDays(new Date(), new Date(start));
        if (daysDiff > rule.days) {
          await prisma.notifications.create({
            data: {
              title: 'تأخير مرحلة',
              message: `تأخير في مرحلة ${rule.stage} للطلب #${rec.OrderId} (المكتب: ${rule.officeName})` ,
              isRead: false,
            },
          });
          generated += 1;
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


