import { PrismaClient } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import { getPageTitleArabic } from 'lib/pageTitleHelper';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { profession } = req.query;
  const professions = await prisma.homemaid.findFirst({
    where: {profession:{gender:"male"}},select:{
        id: true,
        profession: true,
        professionId: true,
        profession:{
            select:{
                id: true,
                name: true,
  });
  res.status(200).json(professions);
}