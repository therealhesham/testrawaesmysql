import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';

function extractImageUrl(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('http') || trimmed.startsWith('data:image') || trimmed.startsWith('/')) {
      return trimmed;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return extractImageUrl(parsed);
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return extractImageUrl(raw[0]);
  }
  if (typeof raw === 'object') {
    return raw.url || raw.link || raw.path || raw.src || null;
  }
  return null;
}

function extractBackupUrl(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return extractBackupUrl(parsed);
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') {
    return raw.originalUrl || raw.backupUrl || null;
  }
  return null;
}

function checkIsEnhanced(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('enhanced') || lower.includes('homemaid-enhanced');
}

function checkIsEdited(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (lower.includes('edited') || lower.includes('homemaid-edited')) && !lower.includes('enhanced');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      search = '', 
      page = '1', 
      perPage = '24', 
      nationality = 'all',
      status = 'all',
      enhanced = 'all'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(60, Math.max(6, parseInt(perPage as string, 10) || 24));
    const term = String(search).trim();

    const whereCondition: any = {
      OR: [
        { Picture: { not: null } },
        { FullPicture: { not: null } },
        { Passportphoto: { not: null } },
      ],
    };

    // Text search filter
    if (term) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        OR: [
          { Name: { contains: term } },
          { Passportnumber: { contains: term } },
          { Nationalitycopy: { contains: term } },
          { officeName: { contains: term } },
        ],
      });
    }

    // Nationality filter
    if (nationality && nationality !== 'all') {
      whereCondition.Nationalitycopy = { contains: nationality as string };
    }

    // Approval / Availability Status filter
    if (status === 'approved') {
      whereCondition.isApproved = true;
    } else if (status === 'not_approved') {
      whereCondition.OR = [{ isApproved: false }, { isApproved: null }];
    } else if (status === 'available') {
      whereCondition.NOT = {
        NewOrder: {
          some: {
            bookingstatus: { notIn: ['cancelled', 'rejected'] },
          },
        },
      };
    } else if (status === 'approved_available') {
      whereCondition.isApproved = true;
      whereCondition.NOT = {
        NewOrder: {
          some: {
            bookingstatus: { notIn: ['cancelled', 'rejected'] },
          },
        },
      };
    }

    // Query maids and enhance logs counts
    const [maids, total, distinctNationalities, enhanceLogs] = await Promise.all([
      prisma.homemaid.findMany({
        where: whereCondition,
        select: {
          id: true,
          Name: true,
          Nationalitycopy: true,
          Passportnumber: true,
          officeName: true,
          bookingstatus: true,
          isApproved: true,
          Picture: true,
          FullPicture: true,
          Passportphoto: true,
        },
        orderBy: { id: 'asc' }, // Oldest to newest
        take: 500, // Reasonable pool for filtering & pagination
      }),
      prisma.homemaid.count({ where: whereCondition }),
      prisma.homemaid.groupBy({
        by: ['Nationalitycopy'],
        where: { Nationalitycopy: { not: null } },
        _count: { id: true },
      }),
      prisma.systemUserLogs.groupBy({
        by: ['BeneficiaryId'],
        where: { actionType: 'enhance', BeneficiaryId: { not: null } },
        _count: { id: true },
      }),
    ]);

    const enhanceCountMap = new Map<number, number>();
    enhanceLogs.forEach((el) => {
      if (el.BeneficiaryId) {
        enhanceCountMap.set(el.BeneficiaryId, el._count.id);
      }
    });

    let formattedMaids = maids.map((m) => {
      const personal = extractImageUrl(m.Picture);
      const full = extractImageUrl(m.FullPicture);
      const passport = extractImageUrl(m.Passportphoto);

      const isPersonalEnhanced = checkIsEnhanced(personal);
      const isFullEnhanced = checkIsEnhanced(full);
      const isPassportEnhanced = checkIsEnhanced(passport);
      const isEnhanced = isPersonalEnhanced || isFullEnhanced || isPassportEnhanced;

      const isPersonalEdited = checkIsEdited(personal);
      const isFullEdited = checkIsEdited(full);
      const isPassportEdited = checkIsEdited(passport);
      const isEdited = (isPersonalEdited || isFullEdited || isPassportEdited) && !isEnhanced;

      const personalBackup = extractBackupUrl(m.Picture);
      const fullBackup = extractBackupUrl(m.FullPicture);
      const originalPhotoUrl = personalBackup || fullBackup || null;
      const hasBackup = Boolean(originalPhotoUrl) || isEnhanced || isEdited;

      const mainImage = personal || full || passport || null;
      const isMainImageEnhanced = checkIsEnhanced(mainImage);
      const isMainImageEdited = checkIsEdited(mainImage);

      const aiEnhanceCount = enhanceCountMap.get(m.id) || (isEnhanced ? 1 : 0);
      const remainingAiQuota = Math.max(0, 2 - aiEnhanceCount);

      return {
        id: m.id,
        name: m.Name || 'عاملة بدون اسم',
        nationality: m.Nationalitycopy || 'غير محدد',
        passportNumber: m.Passportnumber || 'غير متوفر',
        officeName: m.officeName || 'غير محدد',
        bookingStatus: m.bookingstatus,
        isApproved: Boolean(m.isApproved),
        personalPhoto: personal,
        fullPhoto: full,
        passportPhoto: passport,
        originalPhotoUrl,
        hasBackup,
        aiEnhanceCount,
        remainingAiQuota,
        mainImage,
        isEnhanced,
        isPersonalEnhanced,
        isFullEnhanced,
        isPassportEnhanced,
        isMainImageEnhanced,
        isEdited,
        isPersonalEdited,
        isFullEdited,
        isPassportEdited,
        isMainImageEdited,
      };
    }).filter((m) => Boolean(m.mainImage));

    // Filter by enhancement/edit status if requested
    if (enhanced === 'enhanced') {
      formattedMaids = formattedMaids.filter((m) => m.isEnhanced);
    } else if (enhanced === 'edited') {
      formattedMaids = formattedMaids.filter((m) => m.isEdited);
    } else if (enhanced === 'not_enhanced') {
      formattedMaids = formattedMaids.filter((m) => !m.isEnhanced && !m.isEdited);
    }

    const filteredTotal = formattedMaids.length;
    const paginatedMaids = formattedMaids.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

    // List of clean nationalities for filter dropdown
    const availableNationalities = (distinctNationalities as any[])
      .map((n) => ({
        name: n.Nationalitycopy || '',
        count: n._count?.id || (typeof n._count === 'number' ? n._count : 1),
      }))
      .filter((n) => Boolean(n.name));

    return res.status(200).json({
      success: true,
      maids: paginatedMaids,
      total: filteredTotal,
      totalPages: Math.max(1, Math.ceil(filteredTotal / pageSize)),
      currentPage: pageNumber,
      nationalities: availableNationalities,
      stats: {
        totalAll: total,
        enhancedCount: formattedMaids.filter((m) => m.isEnhanced).length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching maids gallery:', error);
    return res.status(500).json({ error: 'FAILED', message: error.message });
  }
}

