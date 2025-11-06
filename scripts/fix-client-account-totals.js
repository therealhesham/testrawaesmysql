const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixClientAccountTotals() {
  console.log('🔧 بدء إصلاح بيانات الإيرادات والمصروفات...\n');

  try {
    // Get all client account statements
    const statements = await prisma.clientAccountStatement.findMany({
      include: {
        entries: true
      }
    });

    console.log(`📊 تم العثور على ${statements.length} كشف حساب\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Calculate totals from entries
        const totalRevenue = statement.entries.reduce(
          (sum, entry) => sum + Number(entry.credit),
          0
        );
        const totalExpenses = statement.entries.reduce(
          (sum, entry) => sum + Number(entry.debit),
          0
        );
        const netAmount = totalRevenue - totalExpenses;

        // Check if values need to be updated
        const currentRevenue = Number(statement.totalRevenue);
        const currentExpenses = Number(statement.totalExpenses);
        const currentNet = Number(statement.netAmount);

        if (
          currentRevenue !== totalRevenue ||
          currentExpenses !== totalExpenses ||
          currentNet !== netAmount
        ) {
          await prisma.clientAccountStatement.update({
            where: { id: statement.id },
            data: {
              totalRevenue,
              totalExpenses,
              netAmount
            }
          });

          console.log(`✅ تم إصلاح كشف حساب #${statement.id}`);
          console.log(`   الإيرادات: ${currentRevenue} → ${totalRevenue}`);
          console.log(`   المصروفات: ${currentExpenses} → ${totalExpenses}`);
          console.log(`   الصافي: ${currentNet} → ${netAmount}\n`);

          fixedCount++;
        } else {
          console.log(`✓ كشف حساب #${statement.id} - القيم صحيحة`);
        }
      } catch (error) {
        console.error(`❌ خطأ في كشف حساب #${statement.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 ملخص الإصلاح:');
    console.log(`   ✅ تم إصلاح: ${fixedCount} كشف حساب`);
    console.log(`   ✓ لم تحتاج إصلاح: ${statements.length - fixedCount - errorCount} كشف حساب`);
    if (errorCount > 0) {
      console.log(`   ❌ أخطاء: ${errorCount} كشف حساب`);
    }
    console.log('\n✨ اكتمل الإصلاح بنجاح!');
  } catch (error) {
    console.error('❌ خطأ عام:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixClientAccountTotals()
  .catch((error) => {
    console.error('فشل الإصلاح:', error);
    process.exit(1);
  });

