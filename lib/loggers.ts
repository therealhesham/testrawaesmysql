import eventBus from './eventBus';
import prisma from './prisma';

if (!(eventBus as any).__loggersInitialized) {
  eventBus.on('ACTION', async (data: any) => {
    try {
      await prisma.systemUserLogs.create({
        data: {
          action: data.type,
          userId: data.userId,
        },
      });




      console.log('✅ Log saved:', data);
    } catch (err) {
      console.error('❌ Log error:', err);
    }
  });

  // إضافة flag عشان نتجنب تسجيل الـ listener أكتر من مرة
  (eventBus as any).__loggersInitialized = true;
}