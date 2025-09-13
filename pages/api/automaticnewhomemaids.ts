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
        stitiching
        ,BirthDate
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
  // Age: '25',
  // BabySitting: 'Yes',
  // BirthDate: '15 NOV 99',
  // Cleaning: 'Yes',
  // Cooking: 'No',
  // Name: 'SAMRAWIT WERKYE GEBREAMLAK',
  // Nationality: 'ETHIOPIAN',
  // OfficeName: 'MAIN DEPARTMENT FOR IMMIGRATION AND NATIONALITY AFFAIRS',
  // Weight: '50',
  // height: '5ft 152cm',
  // laundry: 'Yes',
  // stitic

const newHomemaid = await prisma.automaticEmployee.create({
  data: {cleaning:Cleaning =="Yes"?true:false,
    name: Name,
birthDate:BirthDate,
babySitting:BabySitting=="Yes"?true:false,
// cleaning:cle,
// age,
contractDuration:req.body.Contract_duration,
cooking:Cooking=="Yes"?true:false,
height,
laundry:laundry=="Yes"?true:false,
nationality:Nationality
,
maritalStatus:MaritalStatus,
officeName:OfficeName
,
passportEndDate:PassportEndDate,
passportNumber:PassportNumber,
passportStartDate:PassportStartDate,
religion:Religion,
salary,
stitching:stitiching=="Yes"?true:false,
weight:Weight,
age:req.body.Age

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