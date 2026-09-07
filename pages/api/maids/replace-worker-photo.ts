import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../globalprisma';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { jwtDecode } from 'jwt-decode';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

const initializeS3 = () => {
  if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_BUCKET) {
    return null;
  }

  const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
  return new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: 'sgp1',
  });
};

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

function isAllowedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const allowed = ['digitaloceanspaces.com', 'openrouter.ai', 'replicate.delivery'];
    return allowed.some((domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function getImageBuffer(imageInput: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (imageInput.startsWith('data:image/')) {
    const mimeMatch = imageInput.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '');
    return { buffer: Buffer.from(base64Data, 'base64'), contentType };
  }

  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    if (!isAllowedDomain(imageInput)) {
      throw new Error('مصدر رابط الصورة غير مسموح به (نطاق غير مصرح به)');
    }
    const response = await fetch(imageInput);
    if (!response.ok) {
      throw new Error(`تعذر تحميل الصورة المحسنة من الرابط (Status: ${response.status})`);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  }

  throw new Error('صيغة الصورة المحسنة غير صالحة');
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

  const { maidId, photoType = 'Picture', enhancedImage, originalImage, isAiEnhanced } = req.body;

  if (!maidId || !enhancedImage) {
    return res.status(400).json({ message: 'معرف العاملة والصورة مطلوبان' });
  }

  const numericMaidId = parseInt(String(maidId), 10);
  if (isNaN(numericMaidId)) {
    return res.status(400).json({ message: 'معرف العاملة غير صالح' });
  }

  try {
    // 1. Get image buffer
    const { buffer, contentType } = await getImageBuffer(enhancedImage);
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const isAi = Boolean(isAiEnhanced);
    const filePrefix = isAi ? 'homemaid-enhanced' : 'homemaid-edited';

    let finalImageUrl: string = '';

    // 2. Upload to DigitalOcean Spaces or Local
    const s3 = initializeS3();
    const bucket = process.env.DO_SPACES_BUCKET;

    if (s3 && bucket) {
      const fileName = `${filePrefix}-${Date.now()}-${uuidv4().slice(0, 8)}.${extension}`;
      const key = `homemaid-images/${fileName}`;

      await s3
        .putObject({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        })
        .promise();

      finalImageUrl = `https://${bucket}.sgp1.digitaloceanspaces.com/${key}`;
    } else {
      // Fallback: save to public/images/maids
      const publicDir = path.join(process.cwd(), 'public', 'images', 'maids');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const fileName = `${filePrefix}-${numericMaidId}-${Date.now()}.${extension}`;
      const filePath = path.join(publicDir, fileName);
      fs.writeFileSync(filePath, buffer);
      finalImageUrl = `/images/maids/${fileName}`;
    }

    // 3. Find the worker in database
    const worker = await prisma.homemaid.findUnique({
      where: { id: numericMaidId },
      select: { id: true, Name: true, Nationalitycopy: true, Picture: true, FullPicture: true, Passportphoto: true },
    });

    if (!worker) {
      return res.status(404).json({ message: 'العاملة غير موجودة في قاعدة البيانات' });
    }

    // 4. Update the appropriate field while preserving originalUrl for rollback
    const normalizedType = String(photoType).toLowerCase();
    const updateData: any = {};

    let currentUrl: string | null = null;
    let existingBackup: string | null = null;

    if (normalizedType.includes('personal') || normalizedType === 'picture') {
      currentUrl = extractImageUrl(worker.Picture);
      existingBackup = extractBackupUrl(worker.Picture);
      if (!existingBackup && currentUrl && !checkIsEnhanced(currentUrl) && !checkIsEdited(currentUrl)) {
        existingBackup = currentUrl;
      } else if (!existingBackup && originalImage && !checkIsEnhanced(originalImage) && !checkIsEdited(originalImage)) {
        existingBackup = originalImage;
      }
      updateData.Picture = { url: finalImageUrl, originalUrl: existingBackup || undefined };
    } else if (normalizedType.includes('full') || normalizedType === 'fullpicture') {
      currentUrl = extractImageUrl(worker.FullPicture);
      existingBackup = extractBackupUrl(worker.FullPicture);
      if (!existingBackup && currentUrl && !checkIsEnhanced(currentUrl) && !checkIsEdited(currentUrl)) {
        existingBackup = currentUrl;
      } else if (!existingBackup && originalImage && !checkIsEnhanced(originalImage) && !checkIsEdited(originalImage)) {
        existingBackup = originalImage;
      }
      updateData.FullPicture = { url: finalImageUrl, originalUrl: existingBackup || undefined };
    } else if (normalizedType.includes('passport') || normalizedType === 'passportphoto') {
      currentUrl = worker.Passportphoto;
      updateData.Passportphoto = finalImageUrl;
    } else {
      // Default to personal picture
      currentUrl = extractImageUrl(worker.Picture);
      existingBackup = extractBackupUrl(worker.Picture);
      if (!existingBackup && currentUrl && !checkIsEnhanced(currentUrl) && !checkIsEdited(currentUrl)) {
        existingBackup = currentUrl;
      }
      updateData.Picture = { url: finalImageUrl, originalUrl: existingBackup || undefined };
    }

    const updatedWorker = await prisma.homemaid.update({
      where: { id: numericMaidId },
      data: updateData,
    });

    // 5. Decode user session from cookies for audit logging
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
      console.warn('Could not decode authToken for system logging:', e);
    }

    // 6. Write detailed log to systemUserLogs (سجل أنشطة المستخدمين في النظام)
    const actionLabel = isAi ? 'تحسين صورة بالذكاء الاصطناعي ✨' : 'تعديل وقص صورة العاملة ✂️';
    const actionText = `تم ${actionLabel} للعاملة: ${worker.Name || 'بدون اسم'} (رقم: ${worker.id})`;
    const detailsText = `نوع الصورة: ${photoType} | اسم العاملة: ${worker.Name || 'غير محدد'} | الجنسية: ${worker.Nationalitycopy || 'غير محدد'} | رابط الصورة الجديد: ${finalImageUrl}${existingBackup ? ` | الصورة الأصلية المحفوظة: ${existingBackup}` : ''}`;

    try {
      await prisma.systemUserLogs.create({
        data: {
          userId,
          actionType: isAi ? 'enhance' : 'update',
          action: actionText,
          beneficiary: 'عاملة منزلية',
          BeneficiaryId: worker.id,
          pageRoute: '/admin/image-upscale-test',
          details: detailsText,
        } as any,
      });
      console.log('✅ تم تسجيل العملية في systemUserLogs:', actionText);
    } catch (logErr) {
      console.error('❌ خطأ أثناء التسجيل في systemUserLogs:', logErr);
    }

    // 7. Write log to logs (سجل أنشطة العاملة الخاص)
    try {
      await prisma.logs.create({
        data: {
          userId: username,
          homemaidId: worker.id,
          Status: actionLabel,
          Details: `تم ${isAi ? 'معالجة وتحسين صورة العاملة عبر الذكاء الاصطناعي' : 'تعديل وتأطير صورة العاملة يدوياً'}. نوع الصورة: ${photoType}. المستخدم: ${userFullName || username}. الرابط الجديد: ${finalImageUrl}`,
          reason: 'تحديث وتنسيق صورة العاملة من صفحة محرك تحسين ومعالجة الصور',
        },
      });
      console.log('✅ تم تسجيل العملية في سجل أنشطة العاملة (logs)');
    } catch (maidLogErr) {
      console.error('❌ خطأ أثناء التسجيل في logs:', maidLogErr);
    }

    return res.status(200).json({
      success: true,
      message: isAi ? 'تم حفظ الصورة المحسنة بالذكاء الاصطناعي وتوثيقها في سجل العمليات! ✨' : 'تم حفظ الصورة المعدلة وتوثيقها في سجل العمليات بنجاح! ✂️',
      newImageUrl: finalImageUrl,
      originalBackupUrl: existingBackup,
      maidId: numericMaidId,
      photoType,
    });
  } catch (error: any) {
    console.error('Error replacing worker photo:', error);
    return res.status(500).json({
      error: 'REPLACE_FAILED',
      message: error.message || 'حدث خطأ أثناء حفظ واستبدال الصورة',
    });
  }
}

