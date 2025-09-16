import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const items = await prisma.mainCategory.findMany({ include: { subs: true } })
      return res.status(200).json({ success: true, items })
    }

    if (req.method === 'POST') {
      const { name, mathProcess } = req.body as { name?: string; mathProcess?: string }
      if (!name || !mathProcess) {
        return res.status(400).json({ success: false, message: 'name and mathProcess are required' })
      }
      const item = await prisma.mainCategory.create({ data: { name, mathProcess } })
      return res.status(201).json({ success: true, item })
    }

    if (req.method === 'PUT') {
      const { id, name, mathProcess } = req.body as { id?: number; name?: string; mathProcess?: string }
      if (!id) return res.status(400).json({ success: false, message: 'id is required' })
      const item = await prisma.mainCategory.update({ where: { id: Number(id) }, data: { name, mathProcess } })
      return res.status(200).json({ success: true, item })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body as { id?: number }
      if (!id) return res.status(400).json({ success: false, message: 'id is required' })
      await prisma.mainCategory.delete({ where: { id: Number(id) } })
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error) {
    console.error('mainCategory API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
