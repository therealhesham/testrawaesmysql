import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';
import { jwtDecode } from 'jwt-decode';

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

function getAuthenticatedUser(req: NextApiRequest): { id: number; username: string } | null {
  try {
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach((c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) cookies[k] = decodeURIComponent(v);
      });
    }
    const tokenStr = req.cookies?.authToken || cookies.authToken;
    if (!tokenStr) return null;
    const decoded = jwtDecode<{ id: number | string; username?: string }>(tokenStr);
    const parsedId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : (decoded.id as number);
    if (!parsedId || isNaN(parsedId)) return null;
    return {
      id: parsedId,
      username: decoded.username || `user_${parsedId}`,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 1. Strict Authentication Check
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'غير مصرح: يجب تسجيل الدخول للقيام بهذه العملية',
    });
  }

  const { maidId, photoType = 'Picture' } = req.body;

  if (!maidId) {
    return res.status(400).json({ message: 'معرف العاملة مطلوب' });
  }

  const numericMaidId = parseInt(String(maidId), 10);
  if (isNaN(numericMaidId)) {
    return res.status(400).json({ message: 'معرف العاملة غير صالح' });
  }

  try {
    // 1. Fetch worker
    const worker = await prisma.homemaid.findUnique({
      where: { id: numericMaidId },
      select: {
        id: true,
        Name: true,
        Nationalitycopy: true,
        Picture: true,
        FullPicture: true,
        Passportphoto: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ message: 'العاملة غير موجودة في قاعدة البيانات' });
    }

    const normalizedType = String(photoType).toLowerCase();
    let currentPhotoRaw = worker.Picture;
    if (normalizedType.includes('full') || normalizedType === 'fullpicture') {
      currentPhotoRaw = worker.FullPicture;
    }

    let backupUrl = extractBackupUrl(currentPhotoRaw);

    // If no backup URL in JSON object, attempt fallback search from worker's logs
    if (!backupUrl) {
      const historicalLogs = await prisma.logs.findMany({
        where: { homemaidId: numericMaidId },
        orderBy: { id: 'asc' },
        take: 10,
      });

      // Check if logs contain any original URL reference
      for (const log of historicalLogs) {
        if (log.Details) {
          const match = log.Details.match(/الصورة الأصلية المحفوظة:\s*([^\s|]+)/);
          if (match && match[1]) {
            backupUrl = match[1];
            break;
          }
        }
      }
    }

    // If still not found, search S3 directly by worker ID and timestamp prefix
    if (!backupUrl && process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET && process.env.DO_SPACES_BUCKET) {
      try {
        const AWS = require('aws-sdk');
        const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
        const s3 = new AWS.S3({
          endpoint: spacesEndpoint,
          accessKeyId: process.env.DO_SPACES_KEY,
          secretAccessKey: process.env.DO_SPACES_SECRET,
          region: 'sgp1',
        });
        const bucket = process.env.DO_SPACES_BUCKET;

        const fullUrl = extractImageUrl(worker.FullPicture) || '';
        const fullKey = fullUrl.split('.com/')[1] || '';
        const timestampPrefix = fullKey.match(/\d{7,13}/)?.[0] || '';

        const [homemaidRes, extractedRes] = await Promise.all([
          s3.listObjectsV2({ Bucket: bucket, Prefix: 'homemaid-images/' }).promise(),
          s3.listObjectsV2({ Bucket: bucket, Prefix: 'extracted-images/' }).promise(),
        ]);
        const allObjects = [...(homemaidRes.Contents || []), ...(extractedRes.Contents || [])];
        const match = allObjects.find(
          (f: any) =>
            f.Key &&
            !f.Key.includes('edited') &&
            !f.Key.includes('enhanced') &&
            (f.Key.includes(`-${numericMaidId}-`) || (timestampPrefix && f.Key.includes(timestampPrefix.slice(0, 8))))
        );
        if (match && match.Key) {
          backupUrl = `https://${bucket}.sgp1.digitaloceanspaces.com/${match.Key}`;
        }
      } catch (s3Err) {
        console.warn('S3 fallback search error in restore:', s3Err);
      }
    }

    if (!backupUrl) {
      return res.status(400).json({
        message: 'لا توجد نسخة أصلية سابقة مسجلة لهذه العاملة لاستعادتها',
      });
    }

    // 2. Perform restoration
    const updateData: any = {};
    if (normalizedType.includes('full') || normalizedType === 'fullpicture') {
      updateData.FullPicture = { url: backupUrl, originalUrl: backupUrl };
    } else {
      updateData.Picture = { url: backupUrl, originalUrl: backupUrl };
    }

    await prisma.homemaid.update({
      where: { id: numericMaidId },
      data: updateData,
    });

    // 3. Decode user session from cookies for audit logging
    let userId = 1;
    let username = 'system';
    let userFullName = '';
    try {
      const cookieHeader = req.headers.cookie;
      let cookies: { [key: string]: string } = {};
      if (cookieHeader) {
        cookieHeader.split(';').forEach((c) => {
          const [k, v] = c.trim().split('=');
          if (k && v) cookies[k] = decodeURIComponent(v);
        });
      }
      const tokenStr = req.cookies?.authToken || cookies.authToken;
      if (tokenStr) {
        const decoded = jwtDecode<{ id: number | string; username?: string; name?: string }>(tokenStr);
        const parsedId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : (decoded.id as number);
        if (parsedId && !isNaN(parsedId)) {
          userId = parsedId;
          const userObj = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true },
          });
          if (userObj) {
            username = userObj.username || `user_${userId}`;
            userFullName = userObj.username;
          }
        }
      }
    } catch (e) {
      console.warn('Could not decode authToken for restore logging:', e);
    }

    // 4. Log to systemUserLogs (سجل أنشطة المستخدمين في النظام)
    const actionText = `تم استرجاع الصورة الأصلية السابقة للعاملة: ${worker.Name || 'بدون اسم'} (رقم: ${worker.id})`;
    const detailsText = `نوع الصورة: ${photoType} | تم إلغاء التعديلات واسترجاع الرابط الأصلي: ${backupUrl} | اسم العاملة: ${worker.Name || 'غير محدد'} | الجنسية: ${worker.Nationalitycopy || 'غير محدد'}`;

    try {
      await prisma.systemUserLogs.create({
        data: {
          userId,
          actionType: 'restore',
          action: actionText,
          beneficiary: 'عاملة منزلية',
          BeneficiaryId: worker.id,
          pageRoute: '/admin/image-upscale-test',
          details: detailsText,
        } as any,
      });
      console.log('✅ تم تسجيل استعادة الصورة في systemUserLogs:', actionText);
    } catch (logErr) {
      console.error('❌ خطأ أثناء التسجيل في systemUserLogs:', logErr);
    }

    // 5. Log to logs (سجل أنشطة العاملة)
    try {
      await prisma.logs.create({
        data: {
          userId: username,
          homemaidId: worker.id,
          Status: 'استعادة الصورة الأصلية ↺',
          Details: `تم استرجاع واستعادة الصورة الأصلية السابقة للعاملة وإلغاء أي تعديل أو تحسين سابق. المستخدم: ${userFullName || username}. رابط الصورة الأصلية المستعادة: ${backupUrl}`,
          reason: 'استعادة الصورة الأصلية من صفحة محرك تحسين ومعالجة الصور',
        },
      });
      console.log('✅ تم تسجيل الاستعادة في سجل أنشطة العاملة (logs)');
    } catch (maidLogErr) {
      console.error('❌ خطأ أثناء التسجيل في logs:', maidLogErr);
    }

    return res.status(200).json({
      success: true,
      message: 'تم استعادة الصورة الأصلية للعاملة وتوثيق العملية في سجل النظام بنجاح! ↺',
      restoredUrl: backupUrl,
      maidId: numericMaidId,
      photoType,
    });
  } catch (error: any) {
    console.error('Error restoring original worker photo:', error);
    return res.status(500).json({
      error: 'RESTORE_FAILED',
      message: error.message || 'حدث خطأ أثناء استعادة الصورة الأصلية',
    });
  }
}
