import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, selectedImages, geminiData, originalFileName, notes, processedBy } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Create the extracted record directly (no need for processing session since we're saving immediately)
    const extractedRecord = await prisma.pDFExtractedRecord.create({
      data: {
        sessionId,
        extractedData: geminiData || {},
        selectedImages: selectedImages || [],
        originalFileName: originalFileName || 'document.pdf',
        processedBy: processedBy || 'Unknown',
        notes: notes || ''
      }
    });

    return res.status(200).json({
      success: true,
      recordId: extractedRecord.id,
      message: 'Data saved successfully'
    });

  } catch (error) {
    console.error('Error saving PDF data:', error);
    return res.status(500).json({ 
      error: 'Failed to save PDF data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
