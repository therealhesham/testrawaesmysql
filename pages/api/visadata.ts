import { NextApiRequest, NextApiResponse } from "next";
import prisma from "lib/prisma";
import eventBus from "lib/eventBus";
import { jwtDecode } from "jwt-decode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { visaNumber, gender, profession, visaFile, nationality, clientID } = req.body;
    try {
      const visa = await prisma.visa.create({
        data: { 
          visaNumber, 
          gender, 
          profession, 
          visaFile, 
          nationality,
          clientID: Number(clientID),
        },
      });
      console.log("visa", visa);
      res.status(200).json(visa);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create visa' });
    }
  }

  if (req.method === 'GET') {
    const { clientID } = req.query;
    try {
      const visas = await prisma.visa.findMany({
        where: { clientID: Number(clientID) },
      });
      console.log("visas", visas);
      res.status(200).json({data: visas});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch visas' });
    }
  }

  if (req.method === 'PUT') {
    const { id, visaNumber, gender, profession, visaFile, nationality } = req.body;
    try {
      const visa = await prisma.visa.update({
        where: { id: Number(id) },
        data: { 
          visaNumber, 
          gender, 
          profession, 
          visaFile, 
          nationality,
        },
      });
      res.status(200).json(visa);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update visa' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    try {
      // Get user info for logging
      const cookieHeader = req.headers.cookie;
      let userId: number | null = null;
      if (cookieHeader) {
        try {
          const cookies: { [key: string]: string } = {};
          cookieHeader.split(";").forEach((cookie) => {
            const [key, value] = cookie.trim().split("=");
            cookies[key] = decodeURIComponent(value);
          });
          if (cookies.authToken) {
            const token = jwtDecode(cookies.authToken) as any;
            userId = Number(token.id);
          }
        } catch (e) {
          // Ignore token errors
        }
      }

      const visa = await prisma.visa.findUnique({
        where: { id: Number(id) },
      });

      await prisma.visa.delete({
        where: { id: Number(id) },
      });

      // تسجيل الحدث
      if (visa && userId) {
        eventBus.emit('ACTION', {
          type: `حذف تأشيرة #${id} - ${visa.visaNumber || 'غير محدد'}`,
          actionType: 'delete',
          userId: userId,
        });
      }

      res.status(200).json({ message: 'Visa deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete visa' });
    }
  }
}