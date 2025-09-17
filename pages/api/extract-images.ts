import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      filter: ({ mimetype }) => {
        return mimetype === 'application/pdf';
      },
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;

    if (!file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(file.filepath);

    // Create FormData for the external API
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('pdf', blob, file.originalFilename || 'document.pdf');

    // Call the external image extraction API
    const response = await fetch('https://extract.rawaes.com/extract-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image extraction API failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error extracting images:', error);
    return res.status(500).json({ 
      error: 'Failed to extract images from PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
