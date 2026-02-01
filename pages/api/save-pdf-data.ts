// ✅ استدعاء loggers لتفعيل الـ listener للأحداث
import '../../lib/loggers';

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import eventBus from 'lib/eventBus';

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

// 3. دالة تحليل التواريخ (محسّنة لدعم تنسيقات متعددة)
const parseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '') return null;
    
    // محاولة التحليل المباشر
    let parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    
    // محاولة تنسيقات مختلفة
    // تنسيق: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // تنسيق: DD/MM/YYYY أو DD-MM-YYYY
    const dateParts = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dateParts) {
      const [, day, month, year] = dateParts;
      parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    
    // محاولة ISO format
    parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
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
      const value = sourceObj[key];
      if (value !== undefined && value !== null && value !== "") {
        // تنظيف القيمة من المسافات الزائدة
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed !== '') return trimmed;
        } else {
          return value;
        }
      }
    }
    return null; // إرجاع null بدلاً من string فارغ
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
  
  // دالة تحليل عدد الأطفال
  const parseChildren = (childrenValue: any): number | null => {
    if (childrenValue == null) return null;
    if (typeof childrenValue === 'number') return childrenValue;
    const match = String(childrenValue).match(/\d+/);
    if (match) {
      return parseInt(match[0], 10);
    }
    return null;
  };

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
    Passportnumber: findValue(['PassportNumber', 'passport_number', 'passportNumber', 'passport', 'Passport', 'PASSPORT_NUMBER']),
    PassportStart: parseDate(findValue([
      'PassportStartDate', 'passportStartDate', 'PassportStart', 'passportStart',
      'passport_issue_date', 'passport_issue', 'passport_start', 'PassportStartDate',
      'issue_date', 'issueDate', 'IssueDate', 'passportStartDate', 'PassportStart'
    ])),
    PassportEnd: parseDate(findValue([
      'PassportEndDate', 'passportEndDate', 'PassportEnd', 'passportEnd',
      'passport_expiration', 'passport_expiry', 'passport_end',
      'expiration_date', 'expirationDate', 'ExpirationDate',
      'expiry_date', 'expiryDate', 'ExpiryDate', 'passportEndDate', 'PassportEnd'
    ])),
    Passportphoto: findValue(['Passportphoto', 'passportphoto', 'passport_photo', 'PassportPhoto', 'passport_copy', 'PassportCopy']),
    
    // التعليم والخبرة
    Education: findValue(['Education', 'education', 'EducationLevel', 'educationLevel', 'education_level']),
    Experience: findValue(['Experience', 'experience', 'ExperienceField', 'experienceField', 'experience_field']),
    ExperienceYears: findValue(['ExperienceYears', 'experienceYears', 'experience_years', 'years_of_experience']),
    
    // أرقام الهاتف
    phone: findValue(['phone', 'Phone', 'mobile', 'Mobile', 'phoneNumber', 'phone_number']),
    // clientphonenumber: findValue(['clientphonenumber', 'clientPhoneNumber', 'client_phone_number', 'phone', 'Phone', 'mobile', 'Mobile']),
    
    Salary: findValue(['Salary', 'salary']),
    
    // ✨✨ الطول والوزن (تم تفعيلها وإضافة التحليل الذكي) ✨✨
    weight: parsePhysicalStat(findValue(['Weight', 'weight'])),
    height: parsePhysicalStat(findValue(['Height', 'height'])),
    children: parseChildren(findValue(['children', 'Children', 'children_count', 'ChildrenCount', 'childrenCount','childrencount'])),

    // الصور
    Picture: profileImage ? { url: profileImage } : Prisma.JsonNull,
    FullPicture: fullImage ? { url: fullImage } : Prisma.JsonNull,
    
    // اللغات
    EnglishLanguageLevel: findValue(['EnglishLanguageLevel', 'English'], data) || findValue(['English', 'english', 'englishLevel', 'english_level'], languagesSpoken),
    ArabicLanguageLeveL: findValue(['ArabicLanguageLeveL', 'ArabicLanguageLevel', 'Arabic'], data) || findValue(['Arabic', 'arabic', 'arabicLevel', 'arabic_level'], languagesSpoken),
    
    BabySitterLevel: findValue(['BabySitterLevel', 'BabySitter', 'babySitter', 'babysitter', 'BabySitterLevel', 'BabySitter', 'babySitter', 'babysitter']),
    // المهارات (باستخدام الدالة الذكية للبحث في كل مكان)
    washingLevel: getSkill(['washingLevel', 'WashingLevel', 'WASHING', 'washing', 'Washing']),
    cookingLevel: getSkill(['cookingLevel', 'CookingLevel', 'COOKING', 'cooking', 'Cooking']),
    childcareLevel: getSkill(['childcareLevel', 'ChildcareLevel', 'babysitting', 'BABYSITTING', 'babysetting', 'BabySitter', 'childcare']),
    cleaningLevel: getSkill(['cleaningLevel', 'CleaningLevel', 'CLEANING', 'cleaning', 'Cleaning']),
    // laundryLevel: getSkill(['laundryLevel', 'LaundryLevel', 'LAUNDRY', 'laundry', 'Laundry']),
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
    const { sessionId, selectedImages, geminiData, notes } = req.body;

    if (!sessionId || !geminiData || !geminiData.jsonResponse) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Map Gemini data to homemaid schema
    const homemaidData = mapGeminiDataToHomemaid(geminiData, selectedImages || []);
    
    // 🔍 Debug: طباعة بيانات الجواز للتأكد من استلامها
    const rawData = geminiData.jsonResponse || {};
    console.log('🔍 Passport Data Debug - Raw Data Keys:', Object.keys(rawData).filter(k => 
      k.toLowerCase().includes('passport') || k.toLowerCase().includes('issue') || k.toLowerCase().includes('expir')
    ));
    console.log('🔍 Passport Data Debug - Mapped Data:', {
      Passportnumber: homemaidData.Passportnumber,
      PassportStart: homemaidData.PassportStart,
      PassportEnd: homemaidData.PassportEnd,
      rawData: {
        passport: rawData.passport || rawData.PassportNumber || rawData.passportNumber || rawData.passport_number || rawData.Passportnumber,
        passportStart: rawData.passportStart || rawData.passportStartDate || rawData.PassportStartDate || rawData.passport_issue_date || rawData.passport_start,
        passportEnd: rawData.passportEnd || rawData.passportEndDate || rawData.PassportEndDate || rawData.passport_expiration || rawData.passport_end || rawData.passport_expiry,
      },
      allPassportKeys: Object.keys(rawData).filter(k => k.toLowerCase().includes('passport'))
    });

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
    // 3. التحقق من عدم تكرار رقم الجواز
    // -------------------------------------------------------
    if (homemaidData.Passportnumber) {
      const cleanedPassport = String(homemaidData.Passportnumber).trim().toUpperCase().replace(/\s/g, '');
      const existingHomemaid = await prisma.homemaid.findFirst({
        where: {
          Passportnumber: cleanedPassport
        }
      });

      // إذا لم نجد تطابقاً دقيقاً، نبحث في جميع السجلات للتحقق من وجود الرقم
      if (!existingHomemaid) {
        const allHomemaids = await prisma.homemaid.findMany({
          where: {
            Passportnumber: {
              not: null
            }
          },
          select: {
            Passportnumber: true
          }
        });

        const found = allHomemaids.find(h => {
          if (!h.Passportnumber) return false;
          const existingPassport = String(h.Passportnumber).trim().toUpperCase().replace(/\s/g, '');
          return existingPassport === cleanedPassport;
        });

        if (found) {
          return res.status(400).json({ 
            error: 'رقم الجواز مسجل بالفعل ',
            details: ' رقم الجواز مستخدم من قبل'
          });
        }
      } else {
        return res.status(400).json({ 
          error: 'رقم الجواز مسجل بالفعل',
          details: ' رقم الجواز مستخدم من قبل'
        });
      }

      // تحديث رقم الجواز بالشكل المنظف
      homemaidData.Passportnumber = cleanedPassport;
    }

    // -------------------------------------------------------
    // 4. الحفظ النهائي
    // -------------------------------------------------------
    const createData: any = { ...homemaidData };
    
    if (officeRelation) createData.office = officeRelation;
    if (professionRelation) createData.profession = professionRelation;

    console.log('Final Data Saving to DB:', JSON.stringify(createData, null, 2));

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
    createData.displayOrder = newDisplayOrder;

    const homemaidRecord = await prisma.homemaid.create({
      data: { ...createData, notes: req.body.notes }
    });
    console.log('🔍 Notes:', notes);

    // ✅ إرسال الحدث بعد الرد حتى لا يؤخر العميل
   try {
    // logs
    const token = jwtDecode(req.cookies.authToken); //get the user id from the token
     await prisma.logs.create({
    data: {
        userId: (token as any).username, //username of the user from the token
      homemaidId: homemaidRecord.id,
      Status: 'إضافة عاملة جديدة بخاصية  الـAI',
      Details: `تم إضافة العاملة  ${homemaidData.Name || 'غير محدد'} بنجاح. الجنسية: ${homemaidData.Nationality || 'غير محدد'}, المكتب: ${homemaidRecord.officeName || 'غير محدد'} بخاصية  الـAI`,
      reason: 'إضافة عاملة جديدة من خلال صفحة إضافة عاملة بخاصية  الـAI من خلال ملف PDF',
    },
  }); 
} catch (error) {
  console.error('Error saving logs:', error);
}
    res.status(200).json({
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