import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import prisma from '../globalprisma';
import { invalidateCostCentersCache } from './cost-centers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const subdomain = process.env.DAFTRA_SUBDOMAIN || req.body?.subdomain;
  const apiKey = process.env.DAFTRA_API_KEY || req.body?.apiKey;
  const { name, code, parentId, isPrimary, clientId, userId, clientName, contractNumber } = req.body;

  if (!subdomain || !apiKey || !name) {
    return res.status(400).json({ message: 'Missing required fields (subdomain, apiKey, name)' });
  }

  const isRoot = isPrimary === 1 || isPrimary === true || !parentId;
  const parentIdNum = isRoot ? 0 : Number(parentId);

  const payload = {
    name: name.trim(),
    code: code ? String(code).trim() : '',
    is_primary: isRoot ? 1 : 0,
    cost_center_id: parentIdNum,
    cost_center_ids: isRoot ? '0' : String(parentIdNum)
  };

  console.log('Creating Cost Center in Daftra:', payload);

  const endpoints = [
    `https://${subdomain}.daftra.com/v2/api/entity/cost_center`,
    `https://${subdomain}.daftra.com/api2/v2/api/entity/cost_center`,
    `https://${subdomain}.daftra.com/api2/cost_centers`
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Attempting to create Cost Center at: ${endpoint}`, payload);
      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'APIKEY': apiKey,
          },
        }
      );

      console.log('Daftra Create Cost Center Success:', response.data);
      invalidateCostCentersCache();

      // Log to AccountSystemLogs in database
      try {
        const daftraCcId = response.data?.id || response.data?.data?.id || response.data?.CostCenter?.id;
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

        await prisma.accountSystemLogs.create({
          data: {
            action: `إنشاء مركز تكلفة في دفترة - ${name.trim()} (كود #${code || 'تلقائي'})`,
            actionType: 'daftra_cost_center',
            actionStatus: 'success',
            actionClientId: validClientId,
            actionUserId: validUserId,
            actionNotes: `تم إنشاء مركز تكلفة جديد في دفترة ERP بنجاح${daftraCcId ? ` (معرف المركز بدفترة: #${daftraCcId})` : ''} باسم "${name.trim()}" وكود "${code || 'تلقائي'}" تحت المركز ${parentId ? `رقم #${parentId}` : 'الرئيسي'}${displayContract}${displayClient}`
          }
        });
      } catch (logErr) {
        console.error('Failed to create AccountSystemLog for cost center creation:', logErr);
      }

      return res.status(200).json(response.data);
    } catch (error: any) {
      lastError = error;
      console.error(`Endpoint ${endpoint} failed:`, error?.response?.data || error.message);
      if (error?.response?.status !== 404) {
        // If it's a validation error or something other than 404, return it immediately
        return res.status(error?.response?.status || 500).json(
          error?.response?.data || { message: error.message || 'Error creating cost center' }
        );
      }
    }
  }

  return res.status(lastError?.response?.status || 500).json(
    lastError?.response?.data || { message: lastError?.message || 'Failed to create cost center on Daftra' }
  );
}
