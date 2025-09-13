import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const {
        Age,
        BabySitting,
        Cleaning,
        Contract_duration,
        Cooking,
        MaritalStatus,
        Name,
        Nationality,
        OfficeName,
        PassportEndDate,
        PassportNumber,
        PassportStartDate,
        Religion,
        Weight,
        height,
        laundry,
        salary,
        stitiching,
        BirthDate
      } = req.body;

      const cookieHeader = req.headers.cookie;
      let cookies: { [key: string]: string } = {};
      if (cookieHeader) {
        cookieHeader.split(";").forEach(cookie => {
          const [key, value] = cookie.trim().split("=");
          cookies[key] = decodeURIComponent(value);
        });
      }
      const token = jwtDecode(cookies.authToken);
      const findUser = await prisma.user.findUnique({
        where: { id: token.id },
        include: { role: true }
      });
      if (!findUser?.role?.permissions["إدارة العاملات"]["إضافة"]) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const newHomemaid = await prisma.automaticEmployee.create({
        data: {
          cleaning: Cleaning == "Yes" ? true : false,
          name: Name,
          birthDate: BirthDate,
          babySitting: BabySitting == "Yes" ? true : false,
          contractDuration: Contract_duration,
          cooking: Cooking == "Yes" ? true : false,
          height,
          laundry: laundry == "Yes" ? true : false,
          nationality: Nationality,
          maritalStatus: MaritalStatus,
          officeName: OfficeName,
          passportEndDate: PassportEndDate,
          passportNumber: PassportNumber,
          passportStartDate: PassportStartDate,
          religion: Religion,
          salary,
          stitching: stitiching == "Yes" ? true : false,
          weight: Weight,
          age: Age
        },
      });

      res.status(200).json(newHomemaid);
    } catch (error: any) {
      console.error('Error creating homemaid:', error);
      res.status(500).json({ error: 'Error creating homemaid CV' });
    }
  } else if (req.method === 'GET') {
    try {
      const cookieHeader = req.headers.cookie;
      let cookies: { [key: string]: string } = {};
      if (cookieHeader) {
        cookieHeader.split(";").forEach(cookie => {
          const [key, value] = cookie.trim().split("=");
          cookies[key] = decodeURIComponent(value);
        });
      }
      const token = jwtDecode(cookies.authToken);
      const findUser = await prisma.user.findUnique({
        where: { id: token.id },
        include: { role: true }
      });
      if (!findUser?.role?.permissions["إدارة العاملات"]["عرض"]) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const homemaids = await prisma.automaticEmployee.findMany({
        select: {
          id: true,
          name: true,
          age: true,
          nationality: true,
          birthDate: true,
          babySitting: true,
          cleaning: true,
          cooking: true,
          contractDuration: true,
          height: true,
          laundry: true,
          maritalStatus: true,
          officeName: true,
          passportEndDate: true,
          passportNumber: true,
          passportStartDate: true,
          religion: true,
          salary: true,
          stitching: true,
          weight: true
        }
      });

      res.status(200).json(homemaids);
    } catch (error: any) {
      console.error('Error fetching homemaids:', error);
      res.status(500).json({ error: 'Error fetching homemaid records' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}