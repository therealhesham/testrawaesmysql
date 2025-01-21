
import { NextApiRequest,NextApiResponse } from "next"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
// ```

export default async function handler(
 
 
   req: NextApiRequest,
  res: NextApiResponse) {
// const newuser = await prisma.user.create({data:{admin:req.body.admin,idnumber:req.body.idnumber,role:req.body.role}})
// if(!newuser) return res.json({error:"error creating"}) 

// res.json(newuser)





}