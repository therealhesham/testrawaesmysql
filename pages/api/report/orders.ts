import prisma from "lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if(req.method === 'POST '){

return res.status(405).json({ message: 'Method not allowed' });
}

const in_progress = await prisma.neworder.count({
  where: {
    bookingstatus: {not:{
      in: ["new_order", "new_orders", "delivered", "cancelled","rejected"],
    },}
  },
});


const new_order = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["new_order", "new_orders"],
    }
  },
});
const delivered = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["delivered"],
    }
  },
});
const cancelled = await prisma.neworder.count({
  where: {
    bookingstatus: {
      in: ["cancelled"],
    }
  },
}); 
res.status(200).json({ in_progress, new_order, delivered, cancelled });
}







