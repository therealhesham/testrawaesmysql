import { NextApiRequest, NextApiResponse } from 'next';
import { logAccountingActionFromRequest } from 'lib/accountingLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      exportType,
      reportType,
      format,
      filters,
      recordCount
    } = req.body;

    await logAccountingActionFromRequest(req, {
      action: `تصدير تقرير ${reportType} - النوع: ${exportType} - الصيغة: ${format.toUpperCase()}`,
      actionType: 'export_report',
      actionStatus: 'success',
      actionNotes: `تصدير تقرير ${reportType} بصيغة ${format.toUpperCase()}${filters ? ` - الفلاتر: ${JSON.stringify(filters)}` : ''}${recordCount ? ` - عدد السجلات: ${recordCount}` : ''}`,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging export action:', error);
    res.status(500).json({ error: 'Failed to log export action' });
  }
}

