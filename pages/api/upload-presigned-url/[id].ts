// api/upload-predesigned-url/[id].ts

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
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing order id' });

    if (!process.env.DO_SPACES_BUCKET) {
      throw new Error('DO_SPACES_BUCKET is not defined');
    }

    const fileName = `order-${id}-${Date.now()}.pdf`;


    const key = `${fileName}`;

    console.log('Bucket:', process.env.DO_SPACES_BUCKET);
    console.log('Key:', key);

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,  
      Expires: 60,                     
      ContentType: 'application/pdf',
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
