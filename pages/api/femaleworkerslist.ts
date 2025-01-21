import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {
try {
    const femaleworkerlist=await prisma.femalWorker.findMany({where:{canceled:false,ended:false}});
  res.status(200).send(femaleworkerlist)

} catch (error) {
  // console.log(error)
  res.status(301).send("femaleworkerlist")

// res.send("error")  
}

}

