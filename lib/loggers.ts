// lib/loggers.ts
import eventBus from "./eventBus";
import prisma from "./prisma";

// نتأكد إننا ما نضيفش listener أكتر من مرة
if (!(eventBus as any)._loggersInitialized) {
  eventBus.on("ACTION", async (data: any) => {
    try {
      await prisma.systemUserLogs.create({
        data: {
          action: data.type,
          userId: data.userId,
        },
      });
      console.log("✅ Log saved:", data);
    } catch (err) {
      console.error("❌ Log error:", err);
    }
  });

}
