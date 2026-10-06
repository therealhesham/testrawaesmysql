import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

const setCorsHeaders = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

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
    region: 'sgp1',
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

  const { file, filename, contentType } = req.body;

  if (!file || !filename) {
    return res.status(400).json({ error: 'الملف واسم الملف مطلوبان' });
  }

  if (!process.env.DO_SPACES_BUCKET) {
    return res.status(500).json({ error: 'DO_SPACES_BUCKET is not defined in environment variables' });
  }

  try {
    const s3 = initializeS3();

    const base64Data = file.includes(';base64,') ? file.split(';base64,').pop() : file;
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = filename.toLowerCase().split('.').pop() || 'jpg';
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `worker-photos/${Date.now()}-${uuidv4().substring(0, 8)}-${cleanName}`;

    let fileContentType = contentType;
    if (!fileContentType) {
      if (ext === 'png') fileContentType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') fileContentType = 'image/jpeg';
      else if (ext === 'webp') fileContentType = 'image/webp';
      else if (ext === 'gif') fileContentType = 'image/gif';
      else fileContentType = 'image/jpeg';
    }

    const result = await s3.upload({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: fileContentType,
      ACL: 'public-read',
    }).promise();

    const fileLocation = result.Location;

    return res.status(200).json({
      url: fileLocation,
      filePath: fileLocation,
      key,
    });
  } catch (error: any) {
    console.error('Error uploading worker photo to DigitalOcean Spaces:', error);
    return res.status(500).json({ error: error.message || 'فشل رفع صورة العاملة إلى DigitalOcean Spaces' });
  }
}
