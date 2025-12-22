import eventBus from './eventBus';
import prisma from './prisma';
import { getPageTitleArabic } from './pageTitleHelper';

if (!(eventBus as any).__loggersInitialized) {
  eventBus.on('ACTION', async (data: any) => {
    try {
      // الحصول على عنوان الصفحة بالعربي
      const pageTitle = getPageTitleArabic(data.pageRoute);
      
      // إضافة عنوان الصفحة إلى action إذا كان موجوداً
      let actionText = data.type || '';
      if (pageTitle && actionText) {
        actionText = `${pageTitle} - ${actionText}`;
      } else if (pageTitle) {
        actionText = pageTitle;
      }
      
      await prisma.systemUserLogs.create({
        data: {
          beneficiary: data.beneficiary,
          pageRoute: data.pageRoute,
          BeneficiaryId: data.BeneficiaryId,
          actionType: data.actionType,
          action: actionText,
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