import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid ID' })
  }

  try {
    if (req.method === 'GET') {
      const item = await prisma.offices.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          office: true,
          Country: true,
          phoneNumber: true,
        },
      })

      if (!item) {
        return res.status(404).json({ success: false, message: 'Office not found' })
      }

      return res.status(200).json({ success: true, item })
    }

    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error: any) {
    console.error('Office API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
