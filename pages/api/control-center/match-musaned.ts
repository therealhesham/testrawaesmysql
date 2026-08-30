import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { musanedContracts, dateRange } = req.body;
    
    if (!Array.isArray(musanedContracts)) {
      return res.status(400).json({ error: 'musanedContracts must be an array' });
    }

    // Convert them to a Map for easy lookup by contract number
    const musanedContractsMap = new Map();
    musanedContracts.forEach(c => {
      if (c && c.contract) {
        musanedContractsMap.set(String(c.contract).trim(), {
          nationalId: c.nationalId,
          nationality: c.nationality,
          startDate: c.startDate ? new Date(c.startDate) : null,
        });
      }
    });
    const musanedContractsSet = new Set(musanedContractsMap.keys());

    // بناء فلتر التاريخ إذا كان موجوداً
    let dateFilter = {};
    let dateRangeStr = '';
    
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      // نضع بداية اليوم ونهاية اليوم
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = {
        DateOfApplication: {
          gte: start,
          lte: end,
        }
      };
      
      const formatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        dateRangeStr = `شهر ${start.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`;
      } else {
        dateRangeStr = `من ${start.toLocaleDateString('ar-SA', formatOptions)} إلى ${end.toLocaleDateString('ar-SA', formatOptions)}`;
      }
    }

    // Get all system contracts
    // We only fetch active orders (not cancelled/rejected) and their arrivals
    const activeOrders = await prisma.neworder.findMany({
      where: {
        bookingstatus: {
          notIn: ['cancelled', 'عقد ملغي', 'rejected', 'طلب مرفوض', 'new_order']
        },
        arrivals: {
          some: {
            InternalmusanedContract: {
              not: null,
            },
            ...(Object.keys(dateFilter).length > 0 
              ? {
                  OR: [
                    { InternalmusanedContract: { in: Array.from(musanedContractsSet) } },
                    dateFilter
                  ]
                }
              : {})
          }
        }
      },
      include: {
        arrivals: true,
        client: true,
        HomeMaid: true,
      }
    });

    const systemContractsMap = new Map();
    activeOrders.forEach(order => {
      if (order.arrivals && order.arrivals.length > 0) {
        const contract = order.arrivals[0].InternalmusanedContract?.trim();
        if (contract && contract !== '' && contract !== 'N/A') {
          systemContractsMap.set(contract, {
            orderId: order.id,
            clientName: order.client?.fullname || order.ClientName || 'غير متوفر',
            maidName: order.HomeMaid?.Name || 'غير متوفر',
            nationalId: order.client?.nationalId || order.nationalId || 'غير متوفر',
            nationality: order.HomeMaid?.nationality || 'غير متوفر',
            dateOfApplication: order.arrivals[0].DateOfApplication,
          });
        }
      }
    });

    const missingInSystem: string[] = []; // Contracts in Musaned but not in DB
    const missingInMusaned: any[] = []; // Contracts in DB but not in Musaned
    const matched: any[] = [];

    // Find missing in system and matched
    for (const contract of Array.from(musanedContractsSet)) {
      const musanedInfo = musanedContractsMap.get(contract);
      if (systemContractsMap.has(contract)) {
        const systemInfo = systemContractsMap.get(contract);
        
        const discrepancies = [];
        
        // 1. Check National ID
        if (musanedInfo.nationalId && systemInfo.nationalId && systemInfo.nationalId !== 'غير متوفر') {
          if (String(musanedInfo.nationalId).trim() !== String(systemInfo.nationalId).trim()) {
            discrepancies.push({
              type: 'nationalId',
              musanedValue: musanedInfo.nationalId,
              systemValue: systemInfo.nationalId,
              message: 'اختلاف في هوية صاحب العمل'
            });
          }
        }
        
        // 2. Check Nationality
        if (musanedInfo.nationality && systemInfo.nationality && systemInfo.nationality !== 'غير متوفر') {
          // Normalize Arabic strings for comparison (e.g., الفلبين vs فلبينية)
          const mNat = String(musanedInfo.nationality).trim().toLowerCase();
          const sNat = String(systemInfo.nationality).trim().toLowerCase();
          
          if (!mNat.includes(sNat) && !sNat.includes(mNat) && mNat !== sNat) {
            discrepancies.push({
              type: 'nationality',
              musanedValue: musanedInfo.nationality,
              systemValue: systemInfo.nationality,
              message: 'اختلاف في الجنسية'
            });
          }
        }
        
        // 3. Check Contract Date
        if (musanedInfo.startDate && systemInfo.dateOfApplication) {
          const mDate = new Date(musanedInfo.startDate);
          const sDate = new Date(systemInfo.dateOfApplication);
          
          // Compare dates (ignore time)
          if (mDate.getFullYear() !== sDate.getFullYear() || 
              mDate.getMonth() !== sDate.getMonth() || 
              mDate.getDate() !== sDate.getDate()) {
            discrepancies.push({
              type: 'contractDate',
              musanedValue: mDate.toISOString().split('T')[0],
              systemValue: sDate.toISOString().split('T')[0],
              message: 'اختلاف في تاريخ بداية العقد'
            });
          }
        }

        matched.push({
          contract,
          ...systemInfo,
          discrepancies
        });
      } else {
        missingInSystem.push({
          contract,
          startDate: musanedInfo.startDate ? new Date(musanedInfo.startDate).toISOString() : null
        });
      }
    }

    // Find missing in musaned
    for (const [contract, info] of systemContractsMap.entries()) {
      if (!musanedContractsSet.has(contract)) {
        missingInMusaned.push({ contract, ...info });
      }
    }

    return res.status(200).json({
      missingInSystem,
      missingInMusaned,
      matched,
      summary: {
        totalMusaned: musanedContractsSet.size,
        totalSystem: systemContractsMap.size,
        dateRangeStr: dateRangeStr || undefined
      }
    });
    
  } catch (error) {
    console.error('Error matching contracts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
