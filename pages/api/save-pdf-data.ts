import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// 1. دالة ذكية لاستخراج الأرقام من النصوص (للطول والوزن)
// تحول "152cm" -> 152, "55 kg" -> 55, "60.5" -> 61
const parsePhysicalStat = (value: any): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Math.round(value);
  
  // تنظيف النص: حذف أي شيء ليس رقماً أو نقطة عشرية
  const str = String(value).trim().toLowerCase().replace(/[^\d.]/g, ''); 
  const num = parseFloat(str);
  
  return isNaN(num) ? null : Math.round(num); // التقريب لأقرب عدد صحيح لأن الداتا بيس Int
};

// 2. دالة تحليل النصوص JSON
const parseJsonField = (value: any) => {
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (e) { return value; }
  }
  return value || {};
};

// 3. دالة تحليل التواريخ
const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// 4. دالة تحليل العمر
const parseAge = (ageValue: any): number | null => {
  if (ageValue == null) return null;
  if (typeof ageValue === 'number') return ageValue;
  // استخراج أول رقم موجود في النص (في حال كان النص "25 years")
  const match = String(ageValue).match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return null;
};

// دالة الربط الرئيسية (Mapping)
const mapGeminiDataToHomemaid = (geminiData: any, selectedImages: string[]) => {
  const data = geminiData.jsonResponse || {};
  
  // معالجة المهارات واللغات
  const skills = parseJsonField(data.skills);
  const languagesSpoken = parseJsonField(data.languages_spoken);
  
  // دالة مساعدة للبحث عن قيمة داخل عدة احتمالات للمفاتيح
  const findValue = (keys: string[], sourceObj: any = data) => {
    for (const key of keys) {
      if (sourceObj[key] !== undefined && sourceObj[key] !== null && sourceObj[key] !== "") {
        return sourceObj[key];
      }
    }
    return '';
  };

  // استخراج المهارات (بحث شامل في المستوى الأول وداخل كائن skills)
  const getSkill = (keys: string[]) => {
    // 1. ابحث في data مباشرة
    let val = findValue(keys, data);
    if (val) return val;
    // 2. ابحث داخل skills object
    if (skills) val = findValue(keys, skills);
    return val || '';
  };

  // تجهيز الصور
  const profileImage = selectedImages[0] || null;
  const fullImage = selectedImages[1] || selectedImages[0] || null;
  
  // تجهيز الجنسية
  let nationalityJson: any = null;
  const nationalityValue = findValue(['Nationality', 'nationality']);
  if (nationalityValue) {
    if (typeof nationalityValue === 'string') {
      try { nationalityJson = JSON.parse(nationalityValue); } catch { nationalityJson = nationalityValue; }
    } else {
      nationalityJson = nationalityValue;
    }
  }
  
  return {
    // البيانات الأساسية
    Name: findValue(['Name', 'name', 'full_name', 'FullName']),
    age: parseAge(findValue(['Age', 'age'])),
    Religion: findValue(['Religion', 'religion']),
    maritalstatus: findValue(['MaritalStatus', 'marital_status', 'maritalStatus']),
    dateofbirth: parseDate(findValue(['BirthDate', 'birthDate', 'birth_date', 'date_of_birth'])),
    
    Nationality: nationalityJson,
    Nationalitycopy: typeof nationalityValue === 'string' ? nationalityValue : (nationalityJson ? JSON.stringify(nationalityJson) : ''),
    
    // بيانات المكتب والوظيفة
    officeName: findValue(['company_name', 'CompanyName', 'OfficeName', 'office_name', 'officeName']),
    job: findValue(['job_title', 'JobTitle', 'profession', 'job']), 

    // بيانات الجواز
    Passportnumber: findValue(['PassportNumber', 'passport_number', 'passportNumber']),
    PassportStart: parseDate(findValue(['PassportStartDate', 'passport_issue_date', 'passportStartDate'])),
    PassportEnd: parseDate(findValue(['PassportEndDate', 'passport_expiration', 'passportEndDate'])),
    
    Salary: findValue(['Salary', 'salary']),
    
    // ✨✨ الطول والوزن (تم تفعيلها وإضافة التحليل الذكي) ✨✨
    weight: parsePhysicalStat(findValue(['Weight', 'weight'])),
    height: parsePhysicalStat(findValue(['Height', 'height'])),

    // الصور
    Picture: profileImage ? { url: profileImage } : Prisma.JsonNull,
    FullPicture: fullImage ? { url: fullImage } : Prisma.JsonNull,
    
    // اللغات
    EnglishLanguageLevel: findValue(['EnglishLanguageLevel', 'English'], data) || findValue(['English', 'english'], languagesSpoken),
    ArabicLanguageLeveL: findValue(['ArabicLanguageLeveL', 'ArabicLanguageLevel', 'Arabic'], data) || findValue(['Arabic', 'arabic'], languagesSpoken),
    
    // المهارات (باستخدام الدالة الذكية للبحث في كل مكان)
    washingLevel: getSkill(['washingLevel', 'WashingLevel', 'WASHING', 'washing', 'Washing']),
    cookingLevel: getSkill(['cookingLevel', 'CookingLevel', 'COOKING', 'cooking', 'Cooking']),
    childcareLevel: getSkill(['childcareLevel', 'ChildcareLevel', 'babysitting', 'BABYSITTING', 'babysetting', 'BabySitter', 'childcare']),
    cleaningLevel: getSkill(['cleaningLevel', 'CleaningLevel', 'CLEANING', 'cleaning', 'Cleaning']),
    laundryLevel: getSkill(['laundryLevel', 'LaundryLevel', 'LAUNDRY', 'laundry', 'Laundry']),
    ironingLevel: getSkill(['ironingLevel', 'IroningLevel', 'IRONING', 'ironing', 'Ironing']),
    sewingLevel: getSkill(['sewingLevel', 'SewingLevel', 'SEWING', 'sewing', 'Sewing']),
    elderlycareLevel: getSkill(['elderlycareLevel', 'ElderlycareLevel', 'ELDERLYCARE', 'elderlycare', 'ElderlyCare', 'elderly_care']),
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, selectedImages, geminiData } = req.body;

    if (!sessionId || !geminiData || !geminiData.jsonResponse) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Map Gemini data to homemaid schema
    const homemaidData = mapGeminiDataToHomemaid(geminiData, selectedImages || []);

    // -------------------------------------------------------
    // 1. معالجة ربط المكتب (Office Relation)
    // -------------------------------------------------------
    let officeRelation: any = undefined;
    const officeNameValue = homemaidData.officeName;
    
    if (officeNameValue) {
      const trimmedOfficeName = String(officeNameValue).trim();
      
      // البحث الدقيق
      let office = await prisma.offices.findUnique({
        where: { office: trimmedOfficeName }
      });
      
      // البحث المرن (Case Insensitive & Partial)
      if (!office) {
        const allOffices = await prisma.offices.findMany({
          where: { office: { not: null } }
        });
        
        // تطابق تام مع تجاهل الحالة
        office = allOffices.find(o => o.office?.trim().toLowerCase() === trimmedOfficeName.toLowerCase()) || null;
        
        // تطابق جزئي
        if (!office) {
          office = allOffices.find(o => o.office?.trim().toLowerCase().includes(trimmedOfficeName.toLowerCase())) || null;
        }
        // تطابق جزئي عكسي
        if (!office) {
          office = allOffices.find(o => o.office && trimmedOfficeName.toLowerCase().includes(o.office.trim().toLowerCase())) || null;
        }
      }
      
      if (office) {
        officeRelation = { connect: { office: office.office } };
      } else {
        console.warn(`Office "${trimmedOfficeName}" not found.`);
      }
    }
    
    // حذف الاسم النصي لأننا سنستخدم العلاقة
    delete homemaidData.officeName;

    // -------------------------------------------------------
    // 2. معالجة ربط المهنة (Job Title Relation)
    // -------------------------------------------------------
    let professionRelation: any = undefined;
    const professionNameValue = homemaidData.job; 

    if (professionNameValue) {
        const trimmedProfName = String(professionNameValue).trim();
        
        // البحث الدقيق
        let profession = await prisma.professions.findFirst({
            where: { name: trimmedProfName }
        });

        // البحث المرن
        if (!profession) {
             const allProfs = await prisma.professions.findMany();
             profession = allProfs.find(
                p => p.name.toLowerCase().includes(trimmedProfName.toLowerCase()) || 
                     trimmedProfName.toLowerCase().includes(p.name.toLowerCase())
             ) || null;
        }

        if (profession) {
            professionRelation = { connect: { id: profession.id } };
        }
    }
    // حذف الحقل النصي إذا لم يكن موجوداً في السكيما، أو تركه إذا كان موجوداً
    // (حسب السكيما لديك يوجد حقل job وأيضاً professionId، سنترك job للنص ونضيف العلاقة)

    // -------------------------------------------------------
    // 3. الحفظ النهائي
    // -------------------------------------------------------
    const createData: any = { ...homemaidData };
    
    if (officeRelation) createData.office = officeRelation;
    if (professionRelation) createData.profession = professionRelation;

    console.log('Final Data Saving to DB:', JSON.stringify(createData, null, 2));

    const homemaidRecord = await prisma.homemaid.create({
      data: createData
    });

    return res.status(200).json({
      success: true,
      homemaidId: homemaidRecord.id,
      message: 'Employee data saved successfully'
    });

  } catch (error) {
    console.error('Error saving PDF data:', error);
    return res.status(500).json({ 
      error: 'Failed to save PDF data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}