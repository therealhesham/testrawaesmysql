import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === 'GET') {


  const finder =   await prisma.offices.findMany({})

    // Respond with success
    return res.status(200).json({ success: true, finder});
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST','GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}