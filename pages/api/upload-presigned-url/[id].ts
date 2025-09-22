// api/upload-presigned-url/[id].ts

import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

// Set CORS headers
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
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing order id' });

    if (!process.env.DO_SPACES_BUCKET) {
      throw new Error('DO_SPACES_BUCKET is not defined');
    }

    // Initialize S3 client
    const s3 = initializeS3();

    const fileName = `order-${id}-${Date.now()}.pdf`;
    const key = `contracts/${fileName}`;

    console.log('Generating presigned URL for contract:', {
      bucket: process.env.DO_SPACES_BUCKET,
      key: key,
      id: id,
      timestamp: new Date().toISOString()
    });

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,  
      Expires: 300, // 5 minutes
      ContentType: 'application/pdf',
      ACL: 'public-read',
      Metadata: {
        'upload-type': 'contract',
        'order-id': id as string
      }
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    const filePath = `https://${process.env.DO_SPACES_BUCKET}.sgp1.digitaloceanspaces.com/${key}`;

    console.log('Successfully generated presigned URL for contract:', {
      url: url.substring(0, 100) + '...',
      filePath: filePath
    });

    return res.status(200).json({ 
      url, 
      filePath,
      key,
      expires: 300
    });
  } catch (error: any) {
    console.error('Error generating presigned URL for contract:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
