import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default async function handler(
 
 
 
  req: NextApiRequest,
  res: NextApiResponse
) {
try {
  const {  clientname,
insurance,
    musanedContract,
visanumber,
idnumber,
mobilenumber,
passportnumber,
workername,
age,
experience,
contractstatus,
city,
orderDate,

externaloffice,
nationality,
externalmusanedcontract,
visaordernumber,
notes
}=req.body;
  // await prisma..
  console.log(req.body)
  const createfemaleworker=await prisma.femalWorker.create({data:{ clientname,
insurance,
    musanedContract,
visanumber,
idnumber,
mobilenumber,
passportnumber,
workername,
age,
experience,
contractstatus,
city,
orderDate,
externaloffice,
nationality,
externalmusanedcontract,
visaordernumber,
notes}})

  res.status(200).send(createfemaleworker)

} catch (error) {
  console.log(error)
  res.status(301).send(error)

// res.send("error")  
}

}


