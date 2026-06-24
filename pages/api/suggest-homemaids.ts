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
    const { experience, nationality, religion, age, minAge, maxAge} = req.query;
    
    
    
    const sampleOrders = await prisma.neworder.findMany({
      select: { id: true, HomemaidId: true, bookingstatus: true },
      take: 10,
      orderBy: { id: 'desc' }
    });
    sampleOrders.forEach(o => {
      console.log(`  - Order ${o.id}: HomemaidId=${o.HomemaidId}, Status=${o.bookingstatus || 'null'}`);
    });
    
    const bookedStatuses = [
      "new_order", 
      "new_orders", 
      "delivered",
      "pending",
      "office_link_approved",
      "pending_office_link",
      "external_office_approved",
      "pending_external_office",
      "medical_check_passed",
      "pending_medical_check",
      "foreign_labor_approved",
      "pending_foreign_labor",
      "agency_paid",
      "pending_agency_payment",
      "embassy_approved",
      "pending_embassy",
      "visa_issued",
      "pending_visa",
      "travel_permit_issued",
      "pending_travel_permit",
      "received",
      "pending_receipt"
    ];
    
    const baseBookingStatusCondition = {
      NOT: {
        NewOrder: {
          some: {
            AND: [
              {
                bookingstatus: {
                  in: bookedStatuses
                }
              },
              {
                ReasonOfCancellation: null
              },
              {
                ReasonOfRejection: null
              }
            ]
          }
        }
      }
    };
    
    // تشخيص: عدد جميع العاملات في النظام
    const totalHomemaidsCount = await prisma.homemaid.count();
    console.log(`📊 إجمالي عدد العاملات في النظام: ${totalHomemaidsCount}`);
    
    // تشخيص: عدد العاملات المتاحة
    const totalAvailableCount = await prisma.homemaid.count({
      where: baseBookingStatusCondition
    });
    console.log(`📊 إجمالي عدد العاملات المتاحة (غير محجوزة): ${totalAvailableCount}`);
    
    // تشخيص: عدد العاملات التي لديها طلبات نشطة
    const homemaidsWithActiveOrders = await prisma.homemaid.count({
      where: {
        NewOrder: {
          some: {
            bookingstatus: {
              in: bookedStatuses
            }
          }
        }
      }
    });
    console.log(`🔒 عدد العاملات التي لديها طلبات نشطة محجوزة: ${homemaidsWithActiveOrders}`);
    
    // تشخيص: عرض آخر 3 عاملات تم إضافتهن
    const latestHomemaids = await prisma.homemaid.findMany({
      where: baseBookingStatusCondition,
      orderBy: { id: 'desc' },
      take: 3,
      include: {
        office: {
          select: {
            Country: true,
            office: true,
          },
        },
      },
    });
    console.log('🆕 آخر 3 عاملات متاحة:');
    for (const h of latestHomemaids) {
      const birthDate = h.dateofbirth ? new Date(h.dateofbirth) : null;
      const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'غير محدد';
      
      // جلب طلبات هذه العاملة
      const orders = await prisma.neworder.findMany({
        where: { HomemaidId: h.id },
        select: { id: true, bookingstatus: true }
      });
      
      console.log(`  - ID: ${h.id} | ${h.Name} | العمر: ${age} | الطلبات: ${orders.length > 0 ? orders.map(o => `(${o.id}: ${o.bookingstatus || 'null'})`).join(', ') : 'لا يوجد طلبات'}`);
    }
    
    // تشخيص: عدد العاملات حسب الجنسية فقط (من office.Country أو Nationalitycopy)
    if (nationality) {
      const nationalityOnlyCount = await prisma.homemaid.count({
        where: {
          AND: [ 
            baseBookingStatusCondition,
            {
              OR: [
                {
                  office: {
                    Country: { contains: nationality as string }
                  }
                },
                {
                  Nationalitycopy: { contains: nationality as string }
                }
              ]
            }
          ]
        }
      });
      console.log(`🌍 عدد العاملات بجنسية "${nationality}": ${nationalityOnlyCount}`);
      
      // جلب عينة من العاملات بهذه الجنسية للتشخيص
      const sampleHomemaids = await prisma.homemaid.findMany({
        where: {
          AND: [
            baseBookingStatusCondition,
            {
              OR: [
                {
                  office: {
                    Country: { contains: nationality as string }
                  }
                },
                {
                  Nationalitycopy: { contains: nationality as string }
                }
              ]
            }
          ]
        },
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 5
      });
      
      console.log('📋 عينة من العاملات بهذه الجنسية:');
      sampleHomemaids.forEach(h => {
        const birthDate = h.dateofbirth ? new Date(h.dateofbirth) : null;
        const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'غير محدد';
        console.log(`  - ${h.Name} | العمر: ${age} | الجنسية (Office): ${h.office?.Country || 'غير محدد'} | الجنسية (Copy): ${h.Nationalitycopy || 'غير محدد'} | الدين: ${h.Religion || 'غير محدد'} | الخبرة: ${h.ExperienceYears || 'غير محدد'} | حالة الحجز: ${h.bookingstatus || 'متاح'}`);
      });
    }
    
    // الأولوية: الجنسية والعمر معاً (AND) - دقة أعلى
    const priorityConditions: any[] = [];
    const secondaryConditions: any[] = [];
    
    // الجنسية - أولوية عالية ودقة عالية
    if (nationality) {
      const nationalityStr = nationality as string;
      // البحث الدقيق من خلال Country في جدول office أو Nationalitycopy
      priorityConditions.push({
        OR: [
          {
            office: {
              Country: { contains: nationalityStr }
            }
          },
          {
            Nationalitycopy: { contains: nationalityStr }
          }
        ]
      });
    }

    // العمر - أولوية عالية ودقة عالية
    if (minAge && maxAge) {
      const minAgeNum = parseInt(minAge as string);
      const maxAgeNum = parseInt(maxAge as string);
      
      if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const oldestBirthYear = currentYear - maxAgeNum; 
        const youngestBirthYear = currentYear - minAgeNum; 
        // دقة أعلى: تقليل tolerance إلى ±1 سنة فقط
        priorityConditions.push({
          dateofbirth: {
            gte: new Date(`${oldestBirthYear - 1}-01-01T00:00:00.000Z`), 
            lte: new Date(`${youngestBirthYear + 1}-12-31T23:59:59.999Z`), 
          }
        });
      }
    } else if (age) {
      const ageNum = parseInt(age as string);
      if (!isNaN(ageNum)) {
        const currentYear = new Date().getFullYear();
        const targetBirthYear = currentYear - ageNum;
        // دقة أعلى: تقليل tolerance إلى ±2 سنوات
        priorityConditions.push({
          dateofbirth: {
            gte: new Date(`${targetBirthYear - 2}-01-01T00:00:00.000Z`),
            lte: new Date(`${targetBirthYear + 2}-12-31T23:59:59.999Z`),
          }
        });
      }
    }

    // الدين - أولوية متوسطة
    if (religion) {
      const religionStr = (religion as string).toLowerCase();
      secondaryConditions.push({
        Religion: { contains: religion as string }
      });
      if (religionStr.includes('islam')) {
        secondaryConditions.push({ Religion: { contains: 'Islam' } });
        secondaryConditions.push({ Religion: { contains: 'مسلم' } });
      }
      if (religionStr.includes('non-muslim') || religionStr.includes('غير مسلم')) {
        secondaryConditions.push({ Religion: { contains: 'Non-Muslim' } });
        secondaryConditions.push({ Religion: { contains: 'غير مسلم' } });
      }
    }

    // الخبرة - أولوية أقل
    if (experience) {
      const expStr = (experience as string).toLowerCase();
      secondaryConditions.push({ ExperienceYears: { contains: experience as string } });
      
      if (expStr.includes('1-2') || expStr.includes('1-2 years')) {
        secondaryConditions.push({ ExperienceYears: { contains: '1-2' } });
        secondaryConditions.push({ ExperienceYears: { contains: '1' } });
        secondaryConditions.push({ ExperienceYears: { contains: '2' } });
      }
      if (expStr.includes('3-4') || expStr.includes('3-4 years')) {
        secondaryConditions.push({ ExperienceYears: { contains: '3-4' } });
        secondaryConditions.push({ ExperienceYears: { contains: '3' } });
        secondaryConditions.push({ ExperienceYears: { contains: '4' } });
      }
      if (expStr.includes('5') || expStr.includes('more') || expStr.includes('وأكثر')) {
        secondaryConditions.push({ ExperienceYears: { contains: '5' } });
        secondaryConditions.push({ ExperienceYears: { contains: 'More' } });
        secondaryConditions.push({ ExperienceYears: { contains: 'أكثر' } });
      }
      if (expStr.includes('مدربة') || expStr.includes('training')) {
        secondaryConditions.push({ ExperienceYears: { contains: 'مدربة' } });
        secondaryConditions.push({ ExperienceYears: { contains: 'Training' } });
      }
    }
    
    // بناء شروط البحث: الجنسية والعمر معاً (AND) + باقي الشروط (OR)
    const flexibleConditions: any[] = [];
    
    // إذا كانت هناك جنسية وعمر، ابحث عنهما معاً (أولوية عالية)
    if (priorityConditions.length > 0) {
      flexibleConditions.push({
        AND: priorityConditions
      });
    }
    
    // إضافة الشروط الثانوية
    if (secondaryConditions.length > 0) {
      flexibleConditions.push(...secondaryConditions);
    }

    let homemaids: any[] = [];
    
    // البحث الأول: الجنسية والعمر معاً (أولوية عالية ودقة عالية)
    if (priorityConditions.length > 0) {
      const exactMatchWhereClause: any = {
        AND: [
          baseBookingStatusCondition,
          { AND: priorityConditions } // الجنسية والعمر معاً
        ]
      };
      
      console.log('🔍 شروط البحث الدقيق:', JSON.stringify(exactMatchWhereClause, null, 2));
      
      homemaids = await prisma.homemaid.findMany({
        where: exactMatchWhereClause,
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 30, 
      });
      
      console.log(`✅ تم إيجاد ${homemaids.length} عاملة في البحث الدقيق`);
    }
    
    // إذا لم توجد نتائج كافية، البحث بالجنسية أو العمر فقط
    if (homemaids.length < 10 && flexibleConditions.length > 0) {
      const fallbackWhereClause: any = {
        AND: [
          baseBookingStatusCondition,
          { OR: flexibleConditions }
        ]
      };
      
      const fallbackHomemaids = await prisma.homemaid.findMany({
        where: fallbackWhereClause,
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 30, 
      });
      
      const existingIds = new Set(homemaids.map(h => h.id));
      const newHomemaids = fallbackHomemaids.filter(h => !existingIds.has(h.id));
      homemaids = [...homemaids, ...newHomemaids];
    }
    
    // إذا لم توجد نتائج بعد، جلب جميع العاملات المتاحة
    if (homemaids.length < 5) {
      const allAvailable = await prisma.homemaid.findMany({
        where: baseBookingStatusCondition,
        include: {
          office: {
            select: {
              Country: true,
              office: true,
            },
          },
        },
        take: 30, 
      });
      
      const existingIds = new Set(homemaids.map(h => h.id));
      const newHomemaids = allAvailable.filter(h => !existingIds.has(h.id));
      homemaids = [...homemaids, ...newHomemaids];
    }

    const scoredHomemaids = homemaids.map((homemaid) => {
      let score = 0;
      
      // الجنسية - أولوية عالية جداً (أعلى نقاط)
      if (nationality) {
        const nationalityLower = (nationality as string).toLowerCase();
        const officeCountry = homemaid.office?.Country?.toLowerCase() || '';
        const nationalityCopy = homemaid.Nationalitycopy?.toLowerCase() || '';
        
        // تطابق دقيق (exact match) من office.Country
        if (officeCountry && (officeCountry === nationalityLower || officeCountry.includes(nationalityLower) || nationalityLower.includes(officeCountry))) {
          score += 50; // أعلى نقاط للجنسية
        }
        // تطابق دقيق (exact match) من Nationalitycopy
        else if (nationalityCopy && (nationalityCopy === nationalityLower || nationalityCopy.includes(nationalityLower) || nationalityLower.includes(nationalityCopy))) {
          score += 50; // أعلى نقاط للجنسية
        }
        else if (homemaid.office?.Country || homemaid.Nationalitycopy) {
          score += 2; // أي جنسية موجودة
        }
      }
      
      // العمر - أولوية عالية (ثاني أعلى نقاط)
      if (homemaid.dateofbirth) {
        const birthDate = new Date(homemaid.dateofbirth);
        const currentDate = new Date();
        const calculatedAge = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();
        const finalAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) 
          ? calculatedAge - 1 
          : calculatedAge;
        
        if (minAge && maxAge) {
          const minAgeNum = parseInt(minAge as string);
          const maxAgeNum = parseInt(maxAge as string);
          if (!isNaN(minAgeNum) && !isNaN(maxAgeNum)) {
            // تطابق دقيق داخل الرينج
            if (finalAge >= minAgeNum && finalAge <= maxAgeNum) {
              score += 40; // نقاط عالية للعمر الدقيق
            }
            // قريب جداً (±1 سنة)
            else if (finalAge >= minAgeNum - 1 && finalAge <= maxAgeNum + 1) {
              score += 25; 
            }
            // قريب نسبياً (±2 سنوات)
            else if (finalAge >= minAgeNum - 2 && finalAge <= maxAgeNum + 2) {
              score += 10; 
            }
          }
        } else if (age) {
          const ageDiff = Math.abs(finalAge - parseInt(age as string));
          if (ageDiff === 0) score += 40; // تطابق دقيق
          else if (ageDiff <= 1) score += 25; 
          else if (ageDiff <= 2) score += 15; 
          else if (ageDiff <= 5) score += 5; 
        }
      }
      
      // الدين - أولوية متوسطة
      if (religion && homemaid.Religion) {
        const religionLower = (religion as string).toLowerCase();
        const homemaidReligion = homemaid.Religion.toLowerCase();
        
        if (homemaidReligion.includes(religionLower) || religionLower.includes(homemaidReligion)) {
          score += 15;
        }
        else if (
          (religionLower.includes('islam') && (homemaidReligion.includes('islam') || homemaidReligion.includes('مسلم'))) ||
          (religionLower.includes('non-muslim') && (homemaidReligion.includes('non-muslim') || homemaidReligion.includes('غير مسلم')))
        ) {
          score += 10; 
        }
        else if (homemaidReligion.length > 0) {
          score += 2; 
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

    const sortedHomemaids = scoredHomemaids
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15);
    
    // تشخيص: طباعة أعلى 5 نتائج
    console.log('📊 أعلى 5 نتائج مع نقاط التطابق:');
    sortedHomemaids.slice(0, 5).forEach((h, i) => {
      console.log(`${i + 1}. ${h.Name} - الجنسية: ${h.office?.Country || 'غير محدد'} - الدين: ${h.Religion || 'غير محدد'} - الخبرة: ${h.ExperienceYears || 'غير محدد'} - النقاط: ${h.relevanceScore}`);
    }); 

    const suggestions = sortedHomemaids.map((homemaid) => {
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
        nationality: homemaid.office?.Country || homemaid.Nationalitycopy || null, // من office.Country أو Nationalitycopy
        religion: homemaid.Religion,
        experience: homemaid.ExperienceYears,
        age: calculatedAge,
        passportNumber: homemaid.Passportnumber,
        office: homemaid.office?.office || 'غير محدد',
        country: homemaid.office?.Country || homemaid.Nationalitycopy,
        picture: homemaid.Picture,
        relevanceScore: homemaid.relevanceScore,
        bookingstatus: homemaid.bookingstatus,
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
