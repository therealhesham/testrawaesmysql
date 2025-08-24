import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from './prismaclient'

type ResponseData = {
  success: boolean
  message: string
  data?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // const { username, email, password } = req.query



    const users =await prisma?.user.findMany({select:{id:true,username:true}})
    return res.status(201).json(
     users
    )

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating user'
    })
  }
}