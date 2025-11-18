//@ts-nocheck
//@ts-ignore
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
        BirthDate,
        profileImage,
        fullImage
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
          // cleaning: Cleaning == "Yes" ? true : false,
          name: Name,
          birthDate: BirthDate,
          // babySitting: BabySitting == "Yes" ? true : false,
          contractDuration: Contract_duration,
          // cooking: Cooking == "Yes" ? true : false,
          age: Array.isArray(Age) ? String(Age[0]) : (Age !== undefined ? String(Age) : undefined),
          height,
          // laundry: laundry == "Yes" ? true : false,
          nationality: Array.isArray(Nationality)?Nationality[0]:Nationality,
          maritalStatus: Array.isArray(MaritalStatus)?MaritalStatus[0]:MaritalStatus,
          officeName: Array.isArray(OfficeName)?OfficeName[0]:OfficeName,
          passportEndDate: Array.isArray(PassportEndDate)?PassportEndDate[0]:PassportEndDate,
          passportNumber: Array.isArray(PassportNumber)?PassportNumber[0]:PassportNumber,
          passportStartDate: Array.isArray(PassportStartDate)?PassportStartDate[0]:PassportStartDate,
          religion: Array.isArray(Religion)?Religion[0]:Religion,
          salary:Array.isArray(salary)?salary[0]:salary,
          // stitching: stitiching == "Yes" ? true : false,
          weight: Array.isArray(Weight)?Weight[0]:Weight,
          profileImage: profileImage || null,
          fullImage: fullImage || null,
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
        orderBy: { id: 'desc' },
        select: {
          id: true,
          name: true,
          age: true,
          nationality: true,
          birthDate: true,
          // babySitting: true,
          // cleaning: true,
          // cooking: true,
          contractDuration: true,
          height: true,
          // laundry: true,
          maritalStatus: true,
          officeName: true,
          passportEndDate: true,
          passportNumber: true,
          passportStartDate: true,
          religion: true,
          salary: true,
          // stitching: true,
          weight: true,
          profileImage: true,
          fullImage: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(200).json(homemaids);
    } catch (error: any) {
      console.error('Error fetching homemaids:', error);
      res.status(500).json({ error: 'Error fetching homemaid records' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, ...updateData } = req.body;

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
      if (!findUser?.role?.permissions["إدارة العاملات"]["تعديل"]) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updatedHomemaid = await prisma.automaticEmployee.update({
        where: { id: parseInt(id) },
        data: {
          // cleaning: updateData.Cleaning == "Yes" ? true : false,
          name: updateData.Name,
          birthDate: updateData.BirthDate,
          // babySitting: updateData.BabySitting == "Yes" ? true : false,
          contractDuration: updateData.Contract_duration,
          // cooking: updateData.Cooking == "Yes" ? true : false,
          age: Array.isArray(updateData.Age) ? String(updateData.Age[0]) : (updateData.Age !== undefined ? String(updateData.Age) : undefined),
          height: updateData.height,
          // laundry: updateData.laundry == "Yes" ? true : false,
          nationality: Array.isArray(updateData.Nationality)?updateData.Nationality[0]:updateData.Nationality,
          maritalStatus: Array.isArray(updateData.MaritalStatus)?updateData.MaritalStatus[0]:updateData.MaritalStatus,
          officeName: Array.isArray(updateData.OfficeName)?updateData.OfficeName[0]:updateData.OfficeName,
          passportEndDate: Array.isArray(updateData.PassportEndDate)?updateData.PassportEndDate[0]:updateData.PassportEndDate,
          passportNumber: Array.isArray(updateData.PassportNumber)?updateData.PassportNumber[0]:updateData.PassportNumber,
          passportStartDate: Array.isArray(updateData.PassportStartDate)?updateData.PassportStartDate[0]:updateData.PassportStartDate,
          religion: Array.isArray(updateData.Religion)?updateData.Religion[0]:updateData.Religion,
          salary:Array.isArray(updateData.salary)?updateData.salary[0]:updateData.salary,
          // stitching: updateData.stitiching == "Yes" ? true : false,
          weight: Array.isArray(updateData.Weight)?updateData.Weight[0]:updateData.Weight,
          profileImage: updateData.profileImage || null,
          fullImage: updateData.fullImage || null,
        },
      });

      res.status(200).json(updatedHomemaid);
    } catch (error: any) {
      console.error('Error updating homemaid:', error);
      res.status(500).json({ error: 'Error updating homemaid CV' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
console.log(Number(id))
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
      if (!findUser?.role?.permissions["إدارة العاملات"]["حذف"]) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      await prisma.automaticEmployee.delete({
        where: { id: Number(id as string) },
      });

      res.status(200).json({ message: 'Homemaid deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting homemaid:', error);
      res.status(500).json({ error: 'Error deleting homemaid CV' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}