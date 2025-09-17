import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const spacesEndpoint = new AWS.Endpoint('sgp1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query; // 'profile' or 'full'
    
    if (!type || !['profile', 'full'].includes(type as string)) {
      return res.status(400).json({ error: 'Invalid image type. Must be "profile" or "full"' });
    }

    if (!process.env.DO_SPACES_BUCKET) {
      throw new Error('DO_SPACES_BUCKET is not defined');
    }

    const timestamp = Date.now();
    const fileName = `homemaid-${type}-${timestamp}.jpg`;
    const key = `homemaid-images/${fileName}`;

    console.log('Bucket:', process.env.DO_SPACES_BUCKET);
    console.log('Key:', key);

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,  
      Expires: 60,                     
      ContentType: 'image/jpeg',
      ACL: 'public-read',           
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    const filePath = `https://${process.env.DO_SPACES_BUCKET}.sgp1.digitaloceanspaces.com/${key}`;

    return res.status(200).json({ url, filePath });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
