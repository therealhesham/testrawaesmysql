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
    if (!id) return res.status(400).json({ error: 'Missing image id' });

    if (!process.env.DO_SPACES_BUCKET) {
      throw new Error('DO_SPACES_BUCKET is not defined');
    }

    // Initialize S3 client
    const s3 = initializeS3();

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `image-${id}-${timestamp}-${randomId}.jpg`;
    const key = `extracted-images/${fileName}`;

    console.log('Generating presigned URL for image:', {
      bucket: process.env.DO_SPACES_BUCKET,
      key: key,
      id: id,
      timestamp: new Date().toISOString()
    });

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,  
      Expires: 300, // 5 minutes
      ContentType: 'image/jpeg',
      ACL: 'public-read',
      Metadata: {
        'upload-type': 'extracted-image',
        'image-id': id as string
      }
    };

    const url = await s3.getSignedUrlPromise('putObject', params);
    const filePath = `https://${process.env.DO_SPACES_BUCKET}.sgp1.digitaloceanspaces.com/${key}`;

    console.log('Successfully generated presigned URL for image:', {
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
    console.error('Error generating presigned URL for image:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}