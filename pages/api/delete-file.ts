import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

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
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileUrl, key: directKey } = req.body || req.query || {};

  if (!fileUrl && !directKey) {
    return res.status(400).json({ error: 'fileUrl or key is required' });
  }

  if (!process.env.DO_SPACES_BUCKET) {
    return res.status(500).json({ error: 'DO_SPACES_BUCKET is not defined' });
  }

  try {
    let key = directKey;
    if (!key && typeof fileUrl === 'string') {
      try {
        const urlObj = new URL(fileUrl);
        let pathname = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
        if (pathname.startsWith(`${process.env.DO_SPACES_BUCKET}/`)) {
          pathname = pathname.substring(process.env.DO_SPACES_BUCKET.length + 1);
        }
        key = pathname;
      } catch {
        key = fileUrl;
      }
    }

    if (!key) {
      return res.status(400).json({ error: 'Could not resolve file key' });
    }

    const s3 = initializeS3();
    await s3
      .deleteObject({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: key,
      })
      .promise();

    return res.status(200).json({ success: true, message: 'تم حذف الملف بنجاح من الخادم السحابي' });
  } catch (error: any) {
    console.error('Error deleting file from DO Spaces:', error);
    return res.status(500).json({ error: error.message || 'فشل حذف الملف ' });
  }
}
