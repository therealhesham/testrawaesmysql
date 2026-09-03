import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../globalprisma';
import { invalidateAccountsCache } from './accounts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const subdomain = process.env.DAFTRA_SUBDOMAIN || req.body?.subdomain;
  const apiKey = process.env.DAFTRA_API_KEY || req.body?.apiKey;
  const { name, code, parentId, clientId, userId, clientName, contractNumber } = req.body;

  if (!subdomain || !apiKey || !name) {
    return res.status(400).json({ message: 'Missing required fields (subdomain, apiKey, name)' });
  }

  const parentIdNum = parentId ? Number(parentId) : 0;

  const standardPayload = {
    JournalAccount: {
      name: name.trim(),
      code: code ? String(code).trim() : '',
      journal_cat_id: parentIdNum,
      type: 1
    }
  };

  console.log('Creating Account in Daftra with payload:', standardPayload);

  const attempts = [
    {
      url: `https://${subdomain}.daftra.com/api2/journal_accounts`,
      payload: standardPayload
    },
    {
      url: `https://${subdomain}.daftra.com/api2/journal_accounts.json`,
      payload: standardPayload
    },
    {
      url: `https://${subdomain}.daftra.com/v2/api/entity/journal_account`,
      payload: {
        name: name.trim(),
        code: code ? { code: String(code).trim() } : undefined,
        journal_cat_id: parentIdNum,
        type: 1,
        is_parent: 0,
        status: 1
      }
    }
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      console.log(`Attempting to create Journal Account at: ${attempt.url}`, attempt.payload);
      const response = await axios.post(
        attempt.url,
        attempt.payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'APIKEY': apiKey,
          },
        }
      );

      console.log('Daftra Create Account Success:', response.data);
      invalidateAccountsCache();

      // Log to AccountSystemLogs in database
      try {
        const daftraAccId = response.data?.id || response.data?.data?.id || response.data?.JournalAccount?.id || (typeof response.data?.data === 'number' ? response.data.data : null);
        const displayContract = contractNumber ? ` - عقد رقم #${contractNumber}` : '';
        const displayClient = clientName ? ` للعميل ${clientName}` : '';

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

        const createdLog = await prisma.accountSystemLogs.create({
          data: {
            action: `إنشاء حساب عميل في دفترة - ${name.trim()} (كود #${code || 'تلقائي'})`,
            actionType: 'daftra_client_account',
            actionStatus: 'success',
            actionClientId: validClientId,
            actionUserId: validUserId,
            actionNotes: `تم إنشاء حساب فرعي للعميل في دليل حسابات دفترة ERP بنجاح${daftraAccId ? ` (معرف الحساب بدفترة: #${daftraAccId})` : ''} باسم "${name.trim()}" وكود "${code || 'تلقائي'}" تحت الحساب الرئيسي عملاء دفعات مقدمة (1104)${displayContract}${displayClient}`
          }
        });
        console.log('Created AccountSystemLog for account creation with ID:', createdLog.id);
      } catch (logErr) {
        console.error('Failed to create AccountSystemLog for account creation:', logErr);
      }

      return res.status(200).json(response.data);
    } catch (error: any) {
      lastError = error;
      console.error(`Endpoint ${attempt.url} failed:`, error?.response?.data || error.message);
    }
  }

  return res.status(lastError?.response?.status || 500).json(
    lastError?.response?.data || { message: lastError?.message || 'Failed to create account on Daftra' }
  );
}
