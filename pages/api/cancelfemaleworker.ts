import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {
try {
  //  console.log("deleter",)
  const deletefemaleworker=await prisma.femalWorker.update({where:{id:req.body.id},data:{canceled:true}})
  res.status(200).json(deletefemaleworker.id)

} catch (error) {
  res.status(301).send("failedcanceling")

// res.send("error")  
}

}

