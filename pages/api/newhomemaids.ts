import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
  
const {
  name,
  nationality,
  religion,
  passport,
  maritalStatus,
  experienceField,
  experienceYears,
 passportcopy,
  age,
  washingLevel,
  laundryLevel,
  ironingLevel,
  cleaningLevel,
  cookingLevel,
  sewingLevel,
  childcareLevel,
  elderlycareLevel,
  mobile,
  educationLevel,
  arabicLevel,
  englishLevel,
  salary,
  officeName,
  passportStart,
  passportEnd,
  skills = {},
  Picture,
  FullPicture,
} = req.body;

  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach(cookie => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
const token =   jwtDecode(cookies.authToken)
const findUser  = await prisma.user.findUnique({where:{id:token.id},include:{role:true}})
console.log(token);
if(!findUser?.role?.permissions["إدارة العاملات"]["إضافة"] )return;
console.log(req.body)

const newHomemaid = await prisma.homemaid.create({
  data: {
    Name: name || '',
    Passportphoto: passportcopy || '',  
    Nationalitycopy: nationality || '',
    Religion: religion || '',
    Passportnumber: passport || '',
    maritalstatus: maritalStatus || '',
    Experience: experienceField || '',
    ExperienceYears: experienceYears || '',
    dateofbirth: age ? new Date(age) : null,
    phone: mobile || '',
    clientphonenumber: mobile || '',
    Education: educationLevel || '',
    ArabicLanguageLeveL: arabicLevel || '',
    EnglishLanguageLevel: englishLevel || '',
      laundryLevel: laundryLevel || '',
    ironingLevel: ironingLevel || '',
    cleaningLevel: cleaningLevel || '',
    washingLevel: washingLevel || '',
      cookingLevel: cookingLevel || '',
      sewingLevel: sewingLevel,
    childcareLevel: childcareLevel,
    elderlycareLevel: elderlycareLevel || ''  ,
    // OldPeopleCare:elderlycareLevel,
    Salary: req.body.salary ,
    officeName: officeName || '',
    Picture: Picture || null,
    FullPicture: FullPicture || null,
    PassportStart: passportStart ? new Date(passportStart).toISOString() : null,
    PassportEnd: passportEnd ? new Date(passportEnd).toISOString() : null,
  },
});

console.log(newHomemaid)
      res.status(200).json(newHomemaid);
    } catch (error: any) {
      console.error('Error creating homemaid:', error);
      res.status(500).json({ error: 'Error creating homemaid CV' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}