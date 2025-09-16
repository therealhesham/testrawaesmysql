import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from 'lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { mainCategoryId } = req.query
      const where = mainCategoryId ? { mainCategory_id: Number(mainCategoryId) } : {}
      const items = await prisma.subCategory.findMany({ where, include: { mainCategory: true } })
      return res.status(200).json({ success: true, items })
    }

    if (req.method === 'POST') {
      const { name, mainCategory_id } = req.body as { name?: string; mainCategory_id?: number }
      if (!name || !mainCategory_id) {
        return res.status(400).json({ success: false, message: 'name and mainCategory_id are required' })
      }
      const item = await prisma.subCategory.create({ data: { name, mainCategory_id: Number(mainCategory_id) } })
      return res.status(201).json({ success: true, item })
    }

    if (req.method === 'PUT') {
      const { id, name, mainCategory_id } = req.body as { id?: number; name?: string; mainCategory_id?: number }
      if (!id) return res.status(400).json({ success: false, message: 'id is required' })
      const item = await prisma.subCategory.update({
        where: { id: Number(id) },
        data: {
          name,
          mainCategory_id: mainCategory_id !== undefined ? Number(mainCategory_id) : undefined,
        },
      })
      return res.status(200).json({ success: true, item })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body as { id?: number }
      if (!id) return res.status(400).json({ success: false, message: 'id is required' })
      await prisma.subCategory.delete({ where: { id: Number(id) } })
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` })
  } catch (error) {
    console.error('subCategory API error:', error)
    return res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
