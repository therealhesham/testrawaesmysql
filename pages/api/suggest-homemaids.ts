import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { experience, nationality, religion, age, minAge, maxAge, ageRange } = req.query;

    // Build where clause for filtering - البحث المرن (غير صارم)
    const whereClause: any = {
      bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered", "cancelled","rejected"]} }, // Only available homemaids
    };

    // بناء شروط OR مرنة - أي عاملات تطابق أي من الشروط
    const flexibleConditions: any[] = [];

    // الجنسية - أعلى أولوية لكن غير إلزامية
    if (nationality) {
      flexibleConditions.push({
        office: {
          Country: { contains: nationality as string }
        }
      });
      // أيضاً البحث في Nationalitycopy كبديل
      flexibleConditions.push({
        Nationalitycopy: { contains: nationality as string }
      });
    }

    // الديانة - مرنة أكثر
    if (religion) {
      const religionStr = (religion as string).toLowerCase();
      // البحث في القيمة الكاملة
      flexibleConditions.push({
        Religion: { contains: religion as string }
      });
      // البحث المرن - إذا كان "Islam" يبحث عن "Islam" أو "مسلم"
      if (religionStr.includes('islam')) {
        flexibleConditions.push({ Religion: { contains: 'Islam' } });
        flexibleConditions.push({ Religion: { contains: 'مسلم' } });
      }
      // إذا كان "Non-Muslim" يبحث عن أي شيء ليس إسلام
      if (religionStr.includes('non-muslim') || religionStr.includes('غير مسلم')) {
        flexibleConditions.push({ Religion: { contains: 'Non-Muslim' } });
        flexibleConditions.push({ Religion: { contains: 'غير مسلم' } });
      }
    }

    // الخبرة - مرنة جداً
    if (experience) {
      const expStr = (experience as string).toLowerCase();
      // البحث الأساسي
      flexibleConditions.push({ ExperienceYears: { contains: experience as string } });
      
      // البحث المرن بناءً على نوع الخبرة
      if (expStr.includes('1-2') || expStr.includes('1-2 years')) {
        flexibleConditions.push({ ExperienceYears: { contains: '1-2' } });
        flexibleConditions.push({ ExperienceYears: { contains: '1' } });
        flexibleConditions.push({ ExperienceYears: { contains: '2' } });
      }
      if (expStr.includes('3-4') || expStr.includes('3-4 years')) {
        flexibleConditions.push({ ExperienceYears: { contains: '3-4' } });
        flexibleConditions.push({ ExperienceYears: { contains: '3' } });
        flexibleConditions.push({ ExperienceYears: { contains: '4' } });
      }
      if (expStr.includes('5') || expStr.includes('more') || expStr.includes('وأكثر')) {
        flexibleConditions.push({ ExperienceYears: { contains: '5' } });
        flexibleConditions.push({ ExperienceYears: { contains: 'More' } });
        flexibleConditions.push({ ExperienceYears: { contains: 'أكثر' } });
      }
      if (expStr.includes('مدربة') || expStr.includes('training')) {
        flexibleConditions.push({ ExperienceYears: { contains: 'مدربة' } });
        flexibleConditions.push({ ExperienceYears: { contains: 'Training' } });
      }
    }

    // العمر - البحث بناءً على الرينج الكامل (minAge و maxAge)
    // العاملات مخزنة كتاريخ ميلاد، لذا نحسب تاريخ الميلاد المناسب للرينج
    if (minAge && maxAge) {
      const minAgeNum = parseInt(minAge as string);
      const maxAgeNum = parseInt(maxAge as string);
      
      if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        
        // للعثور على عاملات بعمر 21-30:
        // - أقدم تاريخ ميلاد = تاريخ ميلاد شخص بعمر 30 (currentYear - 30) - تاريخ أقدم
        // - أحدث تاريخ ميلاد = تاريخ ميلاد شخص بعمر 21 (currentYear - 21) - تاريخ أحدث
        
        // حساب السنوات: 
        // - للعمر 30: تاريخ الميلاد = currentYear - 30 (أقدم تاريخ)
        // - للعمر 21: تاريخ الميلاد = currentYear - 21 (أحدث تاريخ)
        
        // أقدم تاريخ ميلاد مسموح (للعمر 30) - تاريخ الميلاد يجب أن يكون قبل أو في هذا التاريخ
        const oldestBirthYear = currentYear - maxAgeNum; // مثال: 2024 - 30 = 1994
        
        // أحدث تاريخ ميلاد مسموح (للعمر 21) - تاريخ الميلاد يجب أن يكون بعد أو في هذا التاريخ  
        const youngestBirthYear = currentYear - minAgeNum; // مثال: 2024 - 21 = 2003
        
        // البحث في الرينج: تاريخ الميلاد يجب أن يكون بين oldestBirthYear و youngestBirthYear
        // oldestBirthYear = أقدم تاريخ (للعمر الأكبر)، youngestBirthYear = أحدث تاريخ (للعمر الأصغر)
        // مع tolerance ±2 سنوات للبحث المرن
        flexibleConditions.push({
          dateofbirth: {
            gte: new Date(`${oldestBirthYear - 2}-01-01T00:00:00.000Z`), // أقدم تاريخ ميلاد مسموح (مع tolerance)
            lte: new Date(`${youngestBirthYear + 2}-12-31T23:59:59.999Z`), // أحدث تاريخ ميلاد مسموح (مع tolerance)
          }
        });
        
        // مثال للتوضيح: إذا كان الرينج 21-30 والسن الحالي 2024:
        // - oldestBirthYear = 2024 - 30 = 1994 (أقدم تاريخ ميلاد للعمر 30)
        // - youngestBirthYear = 2024 - 21 = 2003 (أحدث تاريخ ميلاد للعمر 21)
        // - البحث: تاريخ الميلاد بين 1992 (1994-2) و 2005 (2003+2)
        // - هذا يضمن العثور على جميع العاملات بعمر بين 19-32 (مع tolerance)
      }
    } else if (age) {
      // Fallback للتوافق مع الطلبات القديمة التي تستخدم age فقط
      const ageNum = parseInt(age as string);
      if (!isNaN(ageNum)) {
        const currentYear = new Date().getFullYear();
        const targetBirthYear = currentYear - ageNum;
        
        // زيادة tolerance إلى ±5 سنوات بدلاً من ±2
        flexibleConditions.push({
          dateofbirth: {
            gte: new Date(`${targetBirthYear - 5}-01-01T00:00:00.000Z`),
            lte: new Date(`${targetBirthYear + 5}-12-31T23:59:59.999Z`),
          }
        });
      }
    }

    // البحث المرن - لا يتطلب تطابق 100%
    // إذا كانت هناك شروط، نبحث بها، وإلا نعرض جميع العاملات المتاحة
    let homemaids: any[] = [];
    
    if (flexibleConditions.length > 0) {
      // البحث الأول: جميع الشروط
      whereClause.OR = flexibleConditions;
      
      homemaids = await prisma.homemaid.findMany({
        where: whereClause,
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 20, // زيادة العدد للحصول على نتائج أكثر
      });
    }
    
    // إذا لم توجد نتائج أو كانت قليلة، البحث بالعمر والجنسية فقط (الأولويات)
    if (homemaids.length < 5) {
      const priorityConditions: any[] = [];
      const priorityWhereClause: any = {
        bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered"]} },
      };
      
      // إضافة شرط الجنسية (أعلى أولوية)
      if (nationality) {
        priorityConditions.push({
          office: { Country: { contains: nationality as string } }
        });
        priorityConditions.push({
          Nationalitycopy: { contains: nationality as string }
        });
      }
      
      // إضافة شرط العمر (ثاني أولوية)
      if (minAge && maxAge) {
        const minAgeNum = parseInt(minAge as string);
        const maxAgeNum = parseInt(maxAge as string);
        if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          
          // حساب السنوات بشكل صحيح
          const oldestBirthYear = currentYear - maxAgeNum; // أقدم تاريخ ميلاد (للعمر الأكبر)
          const youngestBirthYear = currentYear - minAgeNum; // أحدث تاريخ ميلاد (للعمر الأصغر)
          
          priorityConditions.push({
            dateofbirth: {
              gte: new Date(`${oldestBirthYear - 2}-01-01T00:00:00.000Z`), // أقدم تاريخ ميلاد (مع tolerance)
              lte: new Date(`${youngestBirthYear + 2}-12-31T23:59:59.999Z`), // أحدث تاريخ ميلاد (مع tolerance)
            }
          });
        }
      } else if (age) {
        // Fallback للتوافق مع الطلبات القديمة
        const ageNum = parseInt(age as string);
        if (!isNaN(ageNum)) {
          const currentYear = new Date().getFullYear();
          const targetBirthYear = currentYear - ageNum;
          priorityConditions.push({
            dateofbirth: {
              gte: new Date(`${targetBirthYear - 5}-01-01T00:00:00.000Z`),
              lte: new Date(`${targetBirthYear + 5}-12-31T23:59:59.999Z`),
            }
          });
        }
      }
      
      // البحث بالعمر والجنسية فقط
      if (priorityConditions.length > 0) {
        priorityWhereClause.OR = priorityConditions;
        
        const priorityHomemaids = await prisma.homemaid.findMany({
          where: priorityWhereClause,
          include: {
            office: {
              select: {
                Country: true,
                office: true,
              },
            },
          },
          take: 25, // جلب المزيد من العاملات
        });
        
        // دمج النتائج مع إزالة التكرارات
        const existingIds = new Set(homemaids.map(h => h.id));
        const newHomemaids = priorityHomemaids.filter(h => !existingIds.has(h.id));
        homemaids = [...homemaids, ...newHomemaids];
      }
      
      // إذا لم توجد نتائج بعد، أضف جميع العاملات المتاحة
      if (homemaids.length < 5) {
        const allAvailable = await prisma.homemaid.findMany({
          where: {
            bookingstatus: { not: {in: ["booked", "new_order", "new_orders", "delivered", "cancelled","rejected"]} },
          },
          include: {
            office: {
              select: {
                Country: true,
                office: true,
              },
            },
          },
          take: 30, // جلب المزيد من العاملات
        });
        
        // دمج النتائج مع إزالة التكرارات
        const existingIds = new Set(homemaids.map(h => h.id));
        const newHomemaids = allAvailable.filter(h => !existingIds.has(h.id));
        homemaids = [...homemaids, ...newHomemaids];
      }
    }

    // Sort homemaids by relevance score
    const scoredHomemaids = homemaids.map((homemaid) => {
      let score = 0;
      
      // Exact matches get highest score - NATIONALITY FIRST (highest priority) - أكثر مرونة
      if (nationality) {
        const nationalityLower = (nationality as string).toLowerCase();
        // Check office Country field (where nationality is actually stored) - HIGHEST PRIORITY
        if (homemaid.office?.Country?.toLowerCase().includes(nationalityLower) || 
            nationalityLower.includes(homemaid.office?.Country?.toLowerCase() || '')) {
          score += 25; // Highest score for nationality match
        }
        // Also check Nationalitycopy field as fallback
        else if (homemaid.Nationalitycopy?.toLowerCase().includes(nationalityLower) ||
                 nationalityLower.includes(homemaid.Nationalitycopy?.toLowerCase() || '')) {
          score += 15;
        }
        // أي جنسية موجودة تحصل على نقاط قليلة
        else if (homemaid.office?.Country || homemaid.Nationalitycopy) {
          score += 5; // أي جنسية موجودة
        }
      }
      // RELIGION SECOND PRIORITY - أكثر مرونة
      if (religion && homemaid.Religion) {
        const religionLower = (religion as string).toLowerCase();
        const homemaidReligion = homemaid.Religion.toLowerCase();
        
        // Exact match
        if (homemaidReligion.includes(religionLower) || religionLower.includes(homemaidReligion)) {
          score += 20;
        }
        // Partial match - إذا كان البحث "Islam" والعاملة "Islam - الإسلام"
        else if (
          (religionLower.includes('islam') && (homemaidReligion.includes('islam') || homemaidReligion.includes('مسلم'))) ||
          (religionLower.includes('non-muslim') && (homemaidReligion.includes('non-muslim') || homemaidReligion.includes('غير مسلم')))
        ) {
          score += 15; // Partial match score
        }
        // أي ديانة موجودة تحصل على نقاط قليلة
        else if (homemaidReligion.length > 0) {
          score += 3; // أي ديانة موجودة
        }
      }
      
      // AGE THIRD PRIORITY - أكثر مرونة - البحث بناءً على الرينج
      if (homemaid.dateofbirth) {
        // Calculate age from dateofbirth
        const birthDate = new Date(homemaid.dateofbirth);
        const currentDate = new Date();
        const calculatedAge = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        const finalAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? calculatedAge - 1 
          : calculatedAge;
        
        // استخدام الرينج إذا كان متوفراً (الأولوية)
        if (minAge && maxAge) {
          const minAgeNum = parseInt(minAge as string);
          const maxAgeNum = parseInt(maxAge as string);
          if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
            // إذا كان العمر داخل الرينج - أعلى نقاط
            if (finalAge >= minAgeNum && finalAge <= maxAgeNum) {
              score += 20; // أعلى نقاط للعمر داخل الرينج
            }
            // إذا كان قريب من الرينج (±2 سنوات)
            else if (finalAge >= minAgeNum - 2 && finalAge <= maxAgeNum + 2) {
              score += 12; // نقاط متوسطة للعمر قريب من الرينج
            }
            // إذا كان قريب نسبياً (±5 سنوات)
            else if (finalAge >= minAgeNum - 5 && finalAge <= maxAgeNum + 5) {
              score += 5; // نقاط قليلة للعمر قريب نسبياً
            }
          }
        } else if (age) {
          // Fallback للتوافق مع الطلبات القديمة التي تستخدم age فقط
          const ageDiff = Math.abs(finalAge - parseInt(age as string));
          if (ageDiff <= 2) score += 15; // High score for exact age match
          else if (ageDiff <= 5) score += 10; // Medium score for close age
          else if (ageDiff <= 10) score += 5; // Low score for far age
          else if (ageDiff <= 15) score += 2; // Very low score for far age but still relevant
        }
      }
      
      // EXPERIENCE FOURTH PRIORITY - أكثر مرونة
      if (experience && homemaid.ExperienceYears) {
        const expStr = (experience as string).toLowerCase();
        const homemaidExp = (homemaid.ExperienceYears as string).toLowerCase();
        
        // Exact match gets highest score
        if (homemaidExp.includes(expStr) || expStr.includes(homemaidExp)) {
          score += 12;
        }
        // Partial match gets lower score
        else if (
          (expStr.includes('1-2') && (homemaidExp.includes('1-2') || homemaidExp.includes('1') || homemaidExp.includes('2'))) ||
          (expStr.includes('3-4') && (homemaidExp.includes('3-4') || homemaidExp.includes('3') || homemaidExp.includes('4'))) ||
          (expStr.includes('5') && (homemaidExp.includes('5') || homemaidExp.includes('more') || homemaidExp.includes('أكثر'))) ||
          (expStr.includes('مدربة') && (homemaidExp.includes('مدربة') || homemaidExp.includes('training')))
        ) {
          score += 8; // Partial match score
        }
        // أي خبرة موجودة تحصل على نقاط قليلة
        else if (homemaidExp.length > 0) {
          score += 3; // أي خبرة موجودة
        }
      }

      return { ...homemaid, relevanceScore: score };
    });

    // Sort by relevance score (highest first) - لا نفلتر حسب النقاط
    // Priority: Nationality (25) > Religion (20) > Age (15) > Experience (12)
    // عرض جميع النتائج مرتبة حسب النقاط حتى لو كانت النقاط 0 (لا يتطلب تطابق 100%)
    const sortedHomemaids = scoredHomemaids
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // عرض 15 نتيجة مرتبة حسب النقاط

    // Transform the data for the frontend
    const suggestions = sortedHomemaids.map((homemaid) => {
      // Calculate age from dateofbirth
      let calculatedAge = null;
      if (homemaid.dateofbirth) {
        const birthDate = new Date(homemaid.dateofbirth);
        const currentDate = new Date();
        const age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        calculatedAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? age - 1 
          : age;
      }
      
      return {
        id: homemaid.id,
        name: homemaid.Name,
        nationality: homemaid.office?.Country || homemaid.Nationalitycopy, // Use office country as primary nationality
        religion: homemaid.Religion,
        experience: homemaid.ExperienceYears,
        age: calculatedAge,
        passportNumber: homemaid.Passportnumber,
        office: homemaid.office?.office,
        country: homemaid.office?.Country,
        picture: homemaid.Picture,
        relevanceScore: homemaid.relevanceScore,
      };
    });

    res.status(200).json({
      success: true,
      suggestions,
      count: suggestions.length,
      message: suggestions.length === 0 ? "لم يتم العثور على عاملات تطابق المواصفات المطلوبة" : null,
    });
  } catch (error) {
    console.error("Error fetching homemaid suggestions:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal Server Error" 
    });
  } finally {
    await prisma.$disconnect();
  }
}
