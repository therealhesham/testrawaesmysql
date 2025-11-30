import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { jwtDecode } from 'jwt-decode';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Increase body size limit to handle base64-encoded images (up to 10MB images)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

// Initialize AWS S3 with DigitalOcean Spaces
const initializeS3 = () => {
  if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) {
    throw new Error('DigitalOcean Spaces credentials not configured');
  }

  const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
  return new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    region: 'sgp1'
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // التحقق من التوثيق
    const authToken = req.cookies.authToken;
    if (!authToken) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    const token = jwtDecode(authToken) as any;
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    const { title, description, screenshot } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'العنوان والوصف مطلوبان' });
    }

    let screenshotUrl = null;

    // رفع screenshot إذا كان موجوداً
    if (screenshot) {
      try {
        const s3 = initializeS3();
        const buffer = Buffer.from(screenshot, 'base64');
        const key = `complaints/${uuidv4()}-screenshot.png`;

        const result = await s3.upload({
          Bucket: process.env.DO_SPACES_BUCKET!,
          Key: key,
          Body: buffer,
          ContentType: 'image/png',
          ACL: 'public-read',
        }).promise();

        screenshotUrl = result.Location;
      } catch (uploadError: any) {
        console.error('Error uploading screenshot:', uploadError);
        return res.status(500).json({ error: 'فشل في رفع الصورة' });
      }
    }

    // إنشاء الشكوى
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        screenshot: screenshotUrl,
        createdById: user.id,
        status: 'pending',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            pictureurl: true,
          }
        }
      }
    });

    return res.status(200).json({ success: true, complaint });
  } catch (error: any) {
    console.error('Error creating complaint:', error);
    return res.status(500).json({ error: error.message || 'حدث خطأ أثناء إنشاء الشكوى' });
  }
}

