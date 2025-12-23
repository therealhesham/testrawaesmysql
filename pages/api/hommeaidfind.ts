import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { jwtDecode } from 'jwt-decode';
import { getPageTitleArabic } from '../../lib/pageTitleHelper';

// Helper function to get user info from cookies
const getUserFromCookies = (req: NextApiRequest) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  
  if (cookies.authToken) {
    try {
      const token = jwtDecode(cookies.authToken) as any;
      return { 
        userId: token.username || String(token.id) || 'system', 
        username: token.username || 'مستخدم غير محدد',
        numericUserId: typeof token.id === 'string' ? parseInt(token.id, 10) : token.id
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: 'system', username: 'غير محدد', numericUserId: null };
    }
  }
  
  return { userId: 'system', username: 'غير محدد', numericUserId: null };
};

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
    // الحصول على عنوان الصفحة بالعربي
    const pageTitle = getPageTitleArabic(pageRoute);
    
    // إضافة عنوان الصفحة إلى action إذا كان موجوداً
    let actionText = action || '';
    if (pageTitle && actionText) {
      actionText = `${pageTitle} - ${actionText}`;
    } else if (pageTitle) {
      actionText = pageTitle;
    }
    
    await prisma.systemUserLogs.create({
      data: {
        userId,
        actionType,
        action: actionText,
        beneficiary,
        BeneficiaryId: beneficiaryId,
        pageRoute,
        details: pageTitle || null, // اسم الصفحة للعرض في التفاصيل
      } as any,
    });
    console.log('✅ تم حفظ السجل في systemUserLogs:', actionText);
  } catch (error) {
    console.error('❌ خطأ في حفظ السجل في systemUserLogs:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required' });
      }

      const worker = await prisma.homemaid.findUnique({
        where: {
          id: parseInt(id as string)
        },
        include: {
          office: true,
          logs: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      return res.status(200).json(worker);
    } catch (error) {
      console.error('Error fetching worker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Worker ID is required' });
      }

      const { logs, ...updateFields } = updateData;
      
      // جلب البيانات القديمة قبل التحديث للمقارنة
      const oldWorker = await prisma.homemaid.findUnique({
        where: { id: parseInt(id as string) },
      });

      if (!oldWorker) {
        return res.status(404).json({ error: 'Worker not found' });
      }
      
      // معالجة التواريخ (تاريخ الميلاد وتواريخ الجواز)
      const parseDate = (dateString: any) => {
        if (dateString && typeof dateString === 'string' && dateString.trim() !== "") {
            const dateObj = new Date(dateString);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toISOString();
            }
        }
        return undefined;
      };

      const dateOfBirthValue = parseDate(updateFields.dateofbirth);
      const passportStartValue = parseDate(updateFields.passportStartDate);
      const passportEndValue = parseDate(updateFields.passportEndDate);

      // تحويل القيم الرقمية (الطول، الوزن، الأطفال)
      const parseIntValue = (val: any) => {
        if (val === "" || val === null) return null;
        const num = parseInt(val);
        return isNaN(num) ? undefined : num;
      };

      // ✨ بناء كائن التحديث مع كافة الحقول المطلوبة ✨
      const allowedFields = {
        Name: updateFields.Name,
        Religion: updateFields.Religion,
        Nationalitycopy: updateFields.Nationalitycopy,
        maritalstatus: updateFields.maritalstatus,

        // ✅ الصور (Json)
        // نقبل: string (URL) / null (مسح) / undefined (عدم التعديل)
        Picture:
          updateFields.Picture === undefined
            ? undefined
            : updateFields.Picture
            ? ({ url: updateFields.Picture } as Prisma.JsonObject)
            : Prisma.JsonNull,
        FullPicture:
          updateFields.FullPicture === undefined
            ? undefined
            : updateFields.FullPicture
            ? ({ url: updateFields.FullPicture } as Prisma.JsonObject)
            : Prisma.JsonNull,
        
    
        // إذا كان العمود اسمه children، استخدم السطر التالي بدلاً من السابق:
        children: parseIntValue(updateFields.childrenCount), 
        
        weight: parseIntValue(updateFields.weight),
        height: parseIntValue(updateFields.height),

        // ✅ التواريخ
        dateofbirth: dateOfBirthValue,
        PassportStart: passportStartValue,
        PassportEnd: passportEndValue,

        Passportnumber: updateFields.Passportnumber,
        phone: updateFields.phone,
        Education: updateFields.Education,
        
        // اللغات
        ArabicLanguageLeveL: updateFields.ArabicLanguageLeveL,
        EnglishLanguageLevel: updateFields.EnglishLanguageLevel,
        
        // الخبرة
        Experience: updateFields.Experience,
        ExperienceYears: updateFields.ExperienceYears,
        
        // ✨ المهارات (تحديث النسختين Small & Capital) ✨
        washingLevel: updateFields.washingLevel,
        WashingLevel: updateFields.washingLevel, 

        ironingLevel: updateFields.ironingLevel,
        IroningLevel: updateFields.ironingLevel, 

        cleaningLevel: updateFields.cleaningLevel,
        CleaningLevel: updateFields.cleaningLevel, 

        cookingLevel: updateFields.cookingLevel,
        CookingLevel: updateFields.cookingLevel, 

        sewingLevel: updateFields.sewingLevel,
        SewingLevel: updateFields.sewingLevel, 

        childcareLevel: updateFields.childcareLevel,
        ChildcareLevel: updateFields.childcareLevel, 

        // ✅ العناية بالرضع
        BabySitterLevel: updateFields.babySitterLevel, 

        elderlycareLevel: updateFields.elderlycareLevel,
        ElderlycareLevel: updateFields.elderlycareLevel, 

        laundryLevel: updateFields.laundryLevel,
        LaundryLevel: updateFields.laundryLevel, 

        officeName: updateFields.officeName,
        Salary: updateFields.salary || updateFields.Salary 
      };

      // إزالة القيم undefined فقط
      const filteredFields = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
      );

      console.log('Filtered update fields:', filteredFields);
      
      const updatedWorker = await prisma.homemaid.update({
        where: {
          id: parseInt(id as string)
        },
        data: filteredFields,
        include: {
          office: true,
          logs: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      // إنشاء log للتعديلات
      try {
        const userInfo = getUserFromCookies(req);
        const changedFields: string[] = [];
        
        // دالة لمقارنة التواريخ (تجاهل الوقت)
        const compareDates = (date1: Date | null | undefined, date2: Date | null | undefined): boolean => {
          if (!date1 && !date2) return true;
          if (!date1 || !date2) return false;
          const d1 = new Date(date1);
          const d2 = new Date(date2);
          return d1.toDateString() === d2.toDateString();
        };

        // دالة لتنسيق التاريخ للعرض
        const formatDateForLog = (date: Date | null | undefined): string => {
          if (!date) return 'فارغ';
          const d = new Date(date);
          return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        };

        // التحقق من الصور - فقط إذا تم تغييرها فعلياً
        // استخراج القيم القديمة
        const oldPictureUrl = oldWorker.Picture && typeof oldWorker.Picture === 'object' && 'url' in oldWorker.Picture 
          ? (oldWorker.Picture as any).url 
          : (oldWorker.Picture || null);
        const oldFullPictureUrl = oldWorker.FullPicture && typeof oldWorker.FullPicture === 'object' && 'url' in oldWorker.FullPicture 
          ? (oldWorker.FullPicture as any).url 
          : (oldWorker.FullPicture || null);

        // استخراج القيم الجديدة من filteredFields (فقط إذا كانت موجودة ومختلفة)
        let newPictureUrl: string | null | undefined = undefined;
        let newFullPictureUrl: string | null | undefined = undefined;

        // التحقق من Picture فقط إذا كان موجوداً في filteredFields
        if ('Picture' in filteredFields) {
          const pictureValue = filteredFields.Picture;
          // التحقق من Prisma.JsonNull
          if (pictureValue === Prisma.JsonNull || pictureValue === null) {
            newPictureUrl = null;
          } else if (typeof pictureValue === 'object' && pictureValue !== null && 'url' in pictureValue) {
            newPictureUrl = (pictureValue as any).url;
          } else if (typeof pictureValue === 'string') {
            newPictureUrl = pictureValue;
          }
        }

        // التحقق من FullPicture فقط إذا كان موجوداً في filteredFields
        if ('FullPicture' in filteredFields) {
          const fullPictureValue = filteredFields.FullPicture;
          // التحقق من Prisma.JsonNull
          if (fullPictureValue === Prisma.JsonNull || fullPictureValue === null) {
            newFullPictureUrl = null;
          } else if (typeof fullPictureValue === 'object' && fullPictureValue !== null && 'url' in fullPictureValue) {
            newFullPictureUrl = (fullPictureValue as any).url;
          } else if (typeof fullPictureValue === 'string') {
            newFullPictureUrl = fullPictureValue;
          }
        }

        // التحقق من تغيير الصورة الشخصية - فقط إذا تغيرت فعلياً
        if (newPictureUrl !== undefined) {
          const oldUrl = String(oldPictureUrl || '');
          const newUrl = String(newPictureUrl || '');
          if (oldUrl !== newUrl) {
            if (newPictureUrl === null && oldPictureUrl) {
              changedFields.push('تم حذف الصورة الشخصية');
            } else if (newPictureUrl && oldPictureUrl !== newPictureUrl) {
              changedFields.push('تم تحديث الصورة الشخصية');
            }
          }
        }

        // التحقق من تغيير صورة بالطول - فقط إذا تغيرت فعلياً
        if (newFullPictureUrl !== undefined) {
          const oldUrl = String(oldFullPictureUrl || '');
          const newUrl = String(newFullPictureUrl || '');
          if (oldUrl !== newUrl) {
            if (newFullPictureUrl === null && oldFullPictureUrl) {
              changedFields.push('تم حذف صورة بالطول');
            } else if (newFullPictureUrl && oldFullPictureUrl !== newFullPictureUrl) {
              changedFields.push('تم تحديث صورة بالطول');
            }
          }
        }

        // التحقق من الحقول الأخرى - فقط إذا تم إرسالها في التحديث
        const fieldMappings: { [key: string]: { old: any; new: any; label: string } } = {
          Name: { old: oldWorker.Name, new: filteredFields.Name, label: 'الاسم' },
          Religion: { old: oldWorker.Religion, new: filteredFields.Religion, label: 'الديانة' },
          Nationalitycopy: { old: oldWorker.Nationalitycopy, new: filteredFields.Nationalitycopy, label: 'الجنسية' },
          maritalstatus: { old: oldWorker.maritalstatus, new: filteredFields.maritalstatus, label: 'الحالة الاجتماعية' },
          children: { old: oldWorker.children, new: filteredFields.children, label: 'عدد الأطفال' },
          weight: { old: oldWorker.weight, new: filteredFields.weight, label: 'الوزن' },
          height: { old: oldWorker.height, new: filteredFields.height, label: 'الطول' },
          dateofbirth: { old: oldWorker.dateofbirth, new: filteredFields.dateofbirth ? new Date(filteredFields.dateofbirth) : undefined, label: 'تاريخ الميلاد' },
          PassportStart: { old: oldWorker.PassportStart, new: filteredFields.PassportStart ? new Date(filteredFields.PassportStart) : undefined, label: 'بداية الجواز' },
          PassportEnd: { old: oldWorker.PassportEnd, new: filteredFields.PassportEnd ? new Date(filteredFields.PassportEnd) : undefined, label: 'نهاية الجواز' },
          Passportnumber: { old: oldWorker.Passportnumber, new: filteredFields.Passportnumber, label: 'رقم جواز السفر' },
          phone: { old: oldWorker.phone, new: filteredFields.phone, label: 'رقم الجوال' },
          Education: { old: oldWorker.Education, new: filteredFields.Education, label: 'التعليم' },
          ArabicLanguageLeveL: { old: oldWorker.ArabicLanguageLeveL, new: filteredFields.ArabicLanguageLeveL, label: 'اللغة العربية' },
          EnglishLanguageLevel: { old: oldWorker.EnglishLanguageLevel, new: filteredFields.EnglishLanguageLevel, label: 'اللغة الإنجليزية' },
          Experience: { old: oldWorker.Experience, new: filteredFields.Experience, label: 'الخبرة' },
          ExperienceYears: { old: oldWorker.ExperienceYears, new: filteredFields.ExperienceYears, label: 'سنوات الخبرة' },
          WashingLevel: { old: oldWorker.WashingLevel, new: filteredFields.WashingLevel, label: 'الغسيل' },
          IroningLevel: { old: oldWorker.IroningLevel, new: filteredFields.IroningLevel, label: 'الكوي' },
          CleaningLevel: { old: oldWorker.CleaningLevel, new: filteredFields.CleaningLevel, label: 'التنظيف' },
          CookingLevel: { old: oldWorker.CookingLevel, new: filteredFields.CookingLevel, label: 'الطبخ' },
          SewingLevel: { old: oldWorker.SewingLevel, new: filteredFields.SewingLevel, label: 'الخياطة' },
          ChildcareLevel: { old: oldWorker.ChildcareLevel, new: filteredFields.ChildcareLevel, label: 'العناية بالأطفال' },
          BabySitterLevel: { old: oldWorker.BabySitterLevel, new: filteredFields.BabySitterLevel, label: 'العناية بالرضع' },
          ElderlycareLevel: { old: oldWorker.ElderlycareLevel, new: filteredFields.ElderlycareLevel, label: 'رعاية كبار السن' },
          LaundryLevel: { old: oldWorker.LaundryLevel, new: filteredFields.LaundryLevel, label: 'الغسيل والكي' },
          officeName: { old: oldWorker.officeName, new: filteredFields.officeName, label: 'اسم المكتب' },
          Salary: { old: oldWorker.Salary, new: filteredFields.Salary, label: 'الراتب' },
        };

        for (const [key, mapping] of Object.entries(fieldMappings)) {
          // التحقق فقط من الحقول التي تم إرسالها في التحديث
          if (key in filteredFields) {
            let hasChanged = false;
            let oldValue: any = mapping.old;
            let newValue: any = mapping.new;

            // معالجة خاصة للتواريخ
            if (key === 'dateofbirth' || key === 'PassportStart' || key === 'PassportEnd') {
              hasChanged = !compareDates(oldValue, newValue);
              if (hasChanged) {
                oldValue = formatDateForLog(oldValue);
                newValue = formatDateForLog(newValue);
              }
            } else {
              // مقارنة عادية للحقول الأخرى
              hasChanged = String(oldValue || '') !== String(newValue || '');
            }

            if (hasChanged) {
              const oldDisplay = oldValue || 'فارغ';
              const newDisplay = newValue || 'فارغ';
              changedFields.push(`${mapping.label}: ${oldDisplay}  الى ${newDisplay}`);
            }
          }
        }

        if (changedFields.length > 0) {
          // تبسيط التفاصيل - فقط التغييرات + بواسطة
          const details = `${changedFields.join(' | ')} | بواسطة: ${userInfo.username}`;
          
          // تسجيل في logs (سجل أنشطة العاملة)
          await prisma.logs.create({
            data: {
              Status: 'تحديث البيانات',
              Details: details,
              homemaidId: parseInt(id as string),
              userId: userInfo.userId,
            }
          });

          // تسجيل في systemUserLogs (سجل النظام)
          if (userInfo.numericUserId) {
            await logToSystemLogs(
              userInfo.numericUserId,
              'تعديل',
              `تم تعديل بيانات العاملة: ${oldWorker.Name || 'غير محدد'} - التغييرات: ${changedFields.slice(0, 3).join(', ')}${changedFields.length > 3 ? ` و ${changedFields.length - 3} تغييرات أخرى` : ''}`,
              'عاملة منزلية',
              parseInt(id as string),
              '/admin/homemaidinfo'
            );
          }
        }
      } catch (logError) {
        console.error('Error creating log:', logError);
        // لا نوقف العملية إذا فشل إنشاء الـ log
      }

      return res.status(200).json(updatedWorker);
    } catch (error) {
      console.error('Error updating worker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 }