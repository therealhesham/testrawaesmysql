import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

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

      return res.status(200).json(updatedWorker);
    } catch (error) {
      console.error('Error updating worker:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}