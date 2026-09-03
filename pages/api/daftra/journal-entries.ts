import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../globalprisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const subdomain = process.env.DAFTRA_SUBDOMAIN || req.body?.subdomain;
  const apiKey = process.env.DAFTRA_API_KEY || req.body?.apiKey;
  const { 
    orderId, 
    lines, 
    notes,
    date,
    clientName,
    contractNumber,
    clientId,
    userId,
    costCenterName,
    clientAccountName,
    revenueAccountName,
    taxAccountName,
    totalAmount,
    revenueAmount,
    taxAmount
  } = req.body;

  if (!subdomain || !apiKey || !lines) {
    console.error('Missing required parameters:', { hasSubdomain: !!subdomain, hasApiKey: !!apiKey, hasLines: !!lines, body: req.body });
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  // Prevent duplicate journal posting if order is already posted
  if (orderId) {
    try {
      const existingOrder: any = await (prisma as any).neworder.findUnique({
        where: { id: Number(orderId) },
        select: { id: true, isJournalPosted: true, daftraJournalId: true, journalPostedAt: true }
      });
      if (existingOrder?.isJournalPosted) {
        return res.status(400).json({
          message: `تم ترحيل هذا القيد مسبقاً إلى دفترة برقم قيد #${existingOrder.daftraJournalId || ''}`
        });
      }
    } catch (checkErr) {
      console.warn('Order duplicate check warning:', checkErr);
    }
  }

  const primaryCostCenterId = lines.find((l: any) => l.cost_center_id)?.cost_center_id;

  const payload: any = {
    "Journal": {
      "date": date || new Date().toISOString().split('T')[0], // YYYY-MM-DD
      "description": notes || `قيد مالي للعقد رقم ${contractNumber || orderId}`,
      "currency_code": "SAR"
    },
    "JournalTransaction": lines.map((line: any) => {
      const item: any = {
        "journal_account_id": Number(line.account_id),
        "currency_debit": Number(line.debit) || 0,
        "currency_credit": Number(line.credit) || 0,
        "description": line.notes || ""
      };
      if (line.cost_center_id) {
        const ccId = Number(line.cost_center_id);
        item["cost_center_id"] = ccId;
        item["cost_center"] = ccId;
        item["cost_center_ids"] = String(ccId);
        item["cost_centers"] = [ccId];
      }
      return item;
    })
  };

  if (primaryCostCenterId) {
    const ccId = Number(primaryCostCenterId);
    payload.Journal["cost_center_id"] = ccId;
    payload.Journal["cost_center"] = ccId;
  }

  console.log('Sending payload to Daftra (API2 with all CC formats):', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      `https://${subdomain}.daftra.com/api2/journals`,
      payload,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'APIKEY': apiKey,
        },
      }
    );

    console.log('Daftra Response:', JSON.stringify(response.data, null, 2));
    const daftraJournalId = response.data?.data?.Journal?.id || response.data?.Journal?.id || response.data?.id;

    // Update order status in database as posted
    if (orderId) {
      try {
        await (prisma as any).neworder.update({
          where: { id: Number(orderId) },
          data: {
            isJournalPosted: true,
            daftraJournalId: String(daftraJournalId || ''),
            journalPostedAt: new Date()
          }
        });
      } catch (orderUpdateErr) {
        console.error('Failed to update neworder isJournalPosted:', orderUpdateErr);
      }
    }
    
    // Log to AccountSystemLogs in database
    try {
      const displayContract = contractNumber || orderId || '';
      const displayClient = clientName || 'غير محدد';

      let validClientId: number | null = null;
      if (clientId) {
        try {
          const existingClient = await prisma.client.findUnique({ where: { id: Number(clientId) }, select: { id: true } });
          if (existingClient) validClientId = existingClient.id;
        } catch (e) {
          console.warn('Client ID lookup warning:', e);
        }
      }

      let validUserId: number | null = null;
      if (userId) {
        try {
          const existingUser = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { id: true } });
          if (existingUser) validUserId = existingUser.id;
        } catch (e) {
          console.warn('User ID lookup warning:', e);
        }
      }
      
      await prisma.accountSystemLogs.create({
        data: {
          action: `ترحيل قيد يومية لدفترة - عقد رقم #${displayContract} للعميل ${displayClient}`,
          actionType: 'daftra_journal_entry',
          actionStatus: 'success',
          actionAmount: totalAmount ? Number(totalAmount) : (lines[0]?.debit ? Number(lines[0].debit) : null),
          actionClientId: validClientId,
          actionUserId: validUserId,
          actionNotes: `تم ترحيل قيد يومية معتمد إلى دفترة ERP بنجاح${daftraJournalId ? ` (رقم القيد بدفترة: #${daftraJournalId})` : ''} - الإجمالي: ${totalAmount || lines[0]?.debit || 0} ر.س (الإيراد: ${revenueAmount || lines[1]?.credit || 0} ر.س، الضريبة: ${taxAmount || lines[2]?.credit || 0} ر.س) - البيان: ${notes || payload.Journal.description} - مركز التكلفة: ${costCenterName || 'غير محدد'} - حساب العميل: ${clientAccountName || 'غير محدد'} - حساب الإيراد: ${revenueAccountName || 'غير محدد'}${taxAccountName ? ` - حساب الضريبة: ${taxAccountName}` : ''}`
        }
      });
    } catch (logErr) {
      console.error('Failed to create AccountSystemLog for journal entry:', logErr);
    }

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error posting journal entry to Daftra:', error?.response?.data || error.message);
    res.status(error?.response?.status || 500).json(error?.response?.data || { message: 'Internal Server Error' });
  }
}
