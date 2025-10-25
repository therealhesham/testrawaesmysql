import eventBus from './eventBus';
import prisma from './prisma';

if (!(eventBus as any).__loggersInitialized) {
  eventBus.on('ACTION', async (data: any) => {
    try {
      await prisma.systemUserLogs.create({
        data: {
          beneficiary: data.beneficiary,
          pageRoute: data.pageRoute,
          BeneficiaryId: data.BeneficiaryId,
          actionType: data.actionType,
          action: data.type,
          userId: data.userId,
        },
      });
      
      console.log("data",data)



      console.log('✅ Log saved:', data);
    } catch (err) {
      console.error('❌ Log error:', err);
    }
  });

  // إضافة flag عشان نتجنب تسجيل الـ listener أكتر من مرة
  (eventBus as any).__loggersInitialized = true;
}