import { NextApiRequest, NextApiResponse } from 'next';
import prisma from './globalprisma';
import { jwtDecode } from 'jwt-decode';
import { getPageTitleArabic } from '../../lib/pageTitleHelper';

// دالة مساعدة لحفظ التعديلات في systemUserLogs
async function logToSystemLogs(
  userId: number,
  actionType: string,
  action: string,
  beneficiary: string,
  beneficiaryId: number,
  pageRoute: string
) {
  try {
    const pageTitle = getPageTitleArabic(pageRoute);
    const details = pageTitle || null;

    await prisma.systemUserLogs.create({
      data: {
        userId,
        actionType,
        action,
        beneficiary,
        BeneficiaryId: beneficiaryId,
        pageRoute,
        details,
      } as any,
    });
    console.log('✅ تم حفظ السجل في systemUserLogs:', action, details);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل في systemUserLogs:', error);
  }
}

// دالة مساعدة لحفظ التعديلات في سجل أنشطة العاملة (logs)
async function logToHomemaidLogs(
  userId: string,
  homemaidId: number,
  status: string,
  details?: string,
  reason?: string
) {
  try {
    await prisma.logs.create({
      data: {
        userId,
        homemaidId,
        Status: status,
        Details: details,
        reason: reason,
      },
    });
    console.log('✅ تم حفظ السجل في logs (العاملة):', status);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل في logs:', error);
  }
}

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
  weight,
  height,
  children,
} = req.body;

  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach(cookie => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
const token = jwtDecode<{ id: number | string }>(cookies.authToken);
const userId = typeof token.id === 'string' ? parseInt(token.id, 10) : (token.id as number);
if (!userId || isNaN(userId)) {
  return res.status(401).json({ error: 'رمز مصادقة غير صالح' });
}
const findUser = await prisma.user.findUnique({where:{id:userId},include:{role:true}})
console.log(token);
if(!findUser?.role?.permissions || !(findUser.role.permissions as any)?.["إدارة العاملات"]?.["إضافة"]) {
  return res.status(403).json({ error: 'غير مصرح لك بإضافة العاملات' });
}
console.log(req.body)

// جلب أعلى displayOrder من الجدول
const maxDisplayOrder = await prisma.homemaid.findFirst({
  orderBy: {
    displayOrder: 'desc'
  },
  select: {
    displayOrder: true
  }
});

const newDisplayOrder = maxDisplayOrder?.displayOrder ? maxDisplayOrder.displayOrder + 1 : 1;

const newHomemaid = await prisma.homemaid.create({
  data: {
    Name: name || '',
    Passportphoto: passportcopy || '',  
    Nationalitycopy: nationality || '',
    Religion: religion || '',
    displayOrder: newDisplayOrder,
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
    weight: weight ? parseInt(weight) : null,
    height: height ? parseInt(height) : null,
    children: children ? parseInt(children) : null,
  },
});

console.log('✅ تم إنشاء العاملة بنجاح:', { id: newHomemaid.id, name: newHomemaid.Name });

// تسجيل العملية في system logs و model logs
console.log('📝 بدء تسجيل السجلات للعاملة الجديدة...');

try {
  // تسجيل في system logs
  console.log('🔄 جاري التسجيل في systemUserLogs...');
  await prisma.systemUserLogs.create({
    data: {
      userId: userId,
      actionType: 'create',
      action: `تم إضافة عاملة جديدة: ${name || 'غير محدد'}`,
      beneficiary: 'عاملة منزلية',
      BeneficiaryId: newHomemaid.id,
      pageRoute: '/admin/newhomemaids',
      details: getPageTitleArabic('/admin/newhomemaids') || null,
    } as any,
  });
  console.log('✅ تم حفظ السجل في systemUserLogs بنجاح');

  // تسجيل في model logs (logs الخاص بالعاملة)
  console.log('🔄 جاري التسجيل في logs...');
  const logUsername = findUser?.username || String(userId);
  await prisma.logs.create({
    data: {
      userId: logUsername,
      homemaidId: newHomemaid.id,
      Status: 'إضافة عاملة جديدة',
      Details: `تم إضافة العاملة ${name || 'غير محدد'} بنجاح. الجنسية: ${nationality || 'غير محدد'}, المكتب: ${officeName || 'غير محدد'}`,
      reason: 'إضافة عاملة جديدة من خلال صفحة إضافة عاملة',
    },
  });
  console.log('✅ تم حفظ السجل في logs بنجاح');

  console.log('🎉 تم حفظ جميع السجلات بنجاح للعاملة:', newHomemaid.id);
} catch (logError: any) {
  // لا نوقف العملية إذا فشل إنشاء الـ log
  console.error('❌ خطأ في حفظ السجلات:', logError?.message || logError);
}

res.status(200).json(newHomemaid);
    } catch (error: any) {
      console.error('Error creating homemaid:', error);
      res.status(500).json({ error: 'Error creating homemaid CV' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}