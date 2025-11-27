const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Fisher-Yates Shuffle Algorithm
 * يضمن ترتيب عشوائي بدون تكرار
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function reorderHomemaidDisplayOrder() {
  try {
    console.log('🔄 بدء إعادة ترتيب سجلات العاملات...');

    // جلب جميع السجلات
    const allHomemaids = await prisma.homemaid.findMany({
      select: {
        id: true,
      },
    });

    const totalRecords = allHomemaids.length;
    console.log(`📊 تم العثور على ${totalRecords} سجل`);

    if (totalRecords === 0) {
      console.log('⚠️  لا توجد سجلات لإعادة ترتيبها');
      return;
    }

    // استخدام خوارزمية Fisher-Yates لخلط السجلات بشكل عشوائي
    const shuffledHomemaids = shuffleArray(allHomemaids);

    // تعيين قيم displayOrder فريدة (من الأعلى إلى الأسفل)
    // بما أن API يستخدم orderBy: {displayOrder: "desc"}، سنعطي أعلى قيمة للأول
    const updates = shuffledHomemaids.map((homemaid, index) => ({
      id: homemaid.id,
      displayOrder: totalRecords - index, // يبدأ من totalRecords وينزل إلى 1
    }));

    console.log('💾 جاري تحديث السجلات...');

    // تحديث جميع السجلات في معاملة واحدة لضمان الاتساق
    await prisma.$transaction(
      updates.map((update) =>
        prisma.homemaid.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
        })
      )
    );

    console.log(`✅ تم إعادة ترتيب ${totalRecords} سجل بنجاح`);
    console.log(`📈 قيم displayOrder الآن من ${totalRecords} إلى 1 (بدون تكرار)`);

    // التحقق من عدم وجود تكرار
    const allDisplayOrders = await prisma.homemaid.findMany({
      select: { displayOrder: true },
    });
    
    const displayOrderSet = new Set(allDisplayOrders.map(h => h.displayOrder));
    const hasDuplicates = displayOrderSet.size !== allDisplayOrders.length;

    if (hasDuplicates) {
      console.warn('⚠️  تحذير: تم العثور على قيم displayOrder مكررة!');
      const duplicates = allDisplayOrders
        .map(h => h.displayOrder)
        .filter((order, index, arr) => arr.indexOf(order) !== index);
      console.warn('القيم المكررة:', [...new Set(duplicates)]);
    } else {
      console.log('✅ التحقق: لا توجد قيم displayOrder مكررة');
      console.log(`✅ جميع القيم فريدة (${displayOrderSet.size} قيمة مختلفة)`);
    }

  } catch (error) {
    console.error('❌ خطأ في إعادة ترتيب السجلات:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل السكريبت
reorderHomemaidDisplayOrder()
  .then(() => {
    console.log('✨ اكتمل السكريبت بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل السكريبت:', error);
    process.exit(1);
  });

