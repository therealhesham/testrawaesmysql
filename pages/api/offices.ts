import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === 'GET') {


  const countriesfinder =   await prisma.offices.findMany({distinct:["Country"]})
  const officesFinder =   await prisma.offices.findMany({distinct:["office"]})

// console.log(finder)
    // Respond with success
    return res.status(200).json({countriesfinder,officesFinder});
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST','GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}