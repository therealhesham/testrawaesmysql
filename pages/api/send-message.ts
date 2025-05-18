import prisma from "./globalprisma";


export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { recipient, message ,sender} = req.body;

    // Basic validation
    if (!recipient || !message) {
      return res.status(400).json({ error: 'Recipient and message are required' });
    }

    // Simulate sending message (replace with real logic, e.g., email or database)
    console.log(`Message to ${recipient}: ${message}`);
const sentData = await prisma.officemssages.create({data:{officeName:recipient,message,isRead:false,type:"inbox",sender}})
    // Respond with success
    return res.status(200).json({ success: true,data:sentData});
  } else {
    // Handle non-POST requests
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}