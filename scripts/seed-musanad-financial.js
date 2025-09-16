const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMusanadFinancialRecords() {
  try {
    console.log('🌱 Starting to seed Musanad Financial Records...');

    // Check if we already have records
    const existingRecords = await prisma.musanadFinancialRecord.count();
    if (existingRecords > 0) {
      console.log(`✅ Musanad Financial Records already exist (${existingRecords} records)`);
      return;
    }

    // Get some existing clients and offices for relationships
    const clients = await prisma.client.findMany({ take: 5 });
    const offices = await prisma.offices.findMany({ take: 3 });
    const orders = await prisma.neworder.findMany({ take: 5 });

    if (clients.length === 0 || offices.length === 0) {
      console.log('⚠️  No clients or offices found. Please seed basic data first.');
      return;
    }

    // Sample financial records data
    const sampleRecords = [
      {
        clientId: clients[0]?.id || null,
        clientName: 'عبدالله عبدالعزيز الحربي',
        officeId: offices[0]?.id || null,
        officeName: offices[0]?.office || 'المكتب 1',
        orderId: orders[0]?.id || null,
        orderNumber: 'ORD-001',
        nationality: 'أوغندا',
        workerName: 'فاطمة أحمد',
        orderDate: new Date('2025-03-04'),
        transferDate: new Date('2025-03-04'),
        transferNumber: '84648',
        revenue: 6248.00,
        expenses: 3938.00,
        netAmount: 2310.00,
        status: 'مكتمل',
        notes: 'تم إنجاز الطلب بنجاح',
        createdBy: 'System'
      },
      {
        clientId: clients[1]?.id || null,
        clientName: 'محمد أحمد السعيد',
        officeId: offices[1]?.id || null,
        officeName: offices[1]?.office || 'المكتب 2',
        orderId: orders[1]?.id || null,
        orderNumber: 'ORD-002',
        nationality: 'إثيوبيا',
        workerName: 'مريم علي',
        orderDate: new Date('2025-03-05'),
        transferDate: new Date('2025-03-05'),
        transferNumber: '84649',
        revenue: 5500.00,
        expenses: 3500.00,
        netAmount: 2000.00,
        status: 'مكتمل',
        notes: 'عقد مكتمل',
        createdBy: 'System'
      },
      {
        clientId: clients[2]?.id || null,
        clientName: 'فاطمة علي محمد',
        officeId: offices[0]?.id || null,
        officeName: offices[0]?.office || 'المكتب 1',
        orderId: orders[2]?.id || null,
        orderNumber: 'ORD-003',
        nationality: 'كينيا',
        workerName: 'خديجة محمد',
        orderDate: new Date('2025-03-06'),
        transferDate: new Date('2025-03-06'),
        transferNumber: '84650',
        revenue: 7200.00,
        expenses: 4500.00,
        netAmount: 2700.00,
        status: 'مكتمل',
        notes: 'عاملة منزلية ممتازة',
        createdBy: 'System'
      },
      {
        clientId: clients[3]?.id || null,
        clientName: 'أحمد محمد العلي',
        officeId: offices[2]?.id || null,
        officeName: offices[2]?.office || 'المكتب 3',
        orderId: orders[3]?.id || null,
        orderNumber: 'ORD-004',
        nationality: 'سريلانكا',
        workerName: 'نورا سامي',
        orderDate: new Date('2025-03-07'),
        transferDate: new Date('2025-03-07'),
        transferNumber: '84651',
        revenue: 4800.00,
        expenses: 3000.00,
        netAmount: 1800.00,
        status: 'مكتمل',
        notes: 'خدمة جيدة',
        createdBy: 'System'
      },
      {
        clientId: clients[4]?.id || null,
        clientName: 'نورا عبدالرحمن',
        officeId: offices[1]?.id || null,
        officeName: offices[1]?.office || 'المكتب 2',
        orderId: orders[4]?.id || null,
        orderNumber: 'ORD-005',
        nationality: 'بنغلاديش',
        workerName: 'سارة أحمد',
        orderDate: new Date('2025-03-08'),
        transferDate: new Date('2025-03-08'),
        transferNumber: '84652',
        revenue: 6500.00,
        expenses: 4200.00,
        netAmount: 2300.00,
        status: 'مكتمل',
        notes: 'عاملة منزلية محترفة',
        createdBy: 'System'
      },
      {
        clientId: clients[0]?.id || null,
        clientName: 'سعد عبدالله المطيري',
        officeId: offices[0]?.id || null,
        officeName: offices[0]?.office || 'المكتب 1',
        orderId: null,
        orderNumber: 'ORD-006',
        nationality: 'نيبال',
        workerName: 'بريتا شارما',
        orderDate: new Date('2025-03-09'),
        transferDate: new Date('2025-03-09'),
        transferNumber: '84653',
        revenue: 5800.00,
        expenses: 3600.00,
        netAmount: 2200.00,
        status: 'مكتمل',
        notes: 'عقد جديد',
        createdBy: 'System'
      },
      {
        clientId: clients[1]?.id || null,
        clientName: 'هند محمد القحطاني',
        officeId: offices[2]?.id || null,
        officeName: offices[2]?.office || 'المكتب 3',
        orderId: null,
        orderNumber: 'ORD-007',
        nationality: 'إندونيسيا',
        workerName: 'سيتي نور',
        orderDate: new Date('2025-03-10'),
        transferDate: new Date('2025-03-10'),
        transferNumber: '84654',
        revenue: 6200.00,
        expenses: 3900.00,
        netAmount: 2300.00,
        status: 'مكتمل',
        notes: 'خدمة ممتازة',
        createdBy: 'System'
      },
      {
        clientId: clients[2]?.id || null,
        clientName: 'خالد سعد الدوسري',
        officeId: offices[1]?.id || null,
        officeName: offices[1]?.office || 'المكتب 2',
        orderId: null,
        orderNumber: 'ORD-008',
        nationality: 'الفلبين',
        workerName: 'ماريا سانتوس',
        orderDate: new Date('2025-03-11'),
        transferDate: new Date('2025-03-11'),
        transferNumber: '84655',
        revenue: 7000.00,
        expenses: 4400.00,
        netAmount: 2600.00,
        status: 'مكتمل',
        notes: 'عاملة منزلية محترفة',
        createdBy: 'System'
      }
    ];

    // Create the records
    for (const record of sampleRecords) {
      await prisma.musanadFinancialRecord.create({
        data: record
      });
    }

    console.log(`✅ Successfully seeded ${sampleRecords.length} Musanad Financial Records`);

    // Calculate and display summary
    const totalRevenue = sampleRecords.reduce((sum, record) => sum + record.revenue, 0);
    const totalExpenses = sampleRecords.reduce((sum, record) => sum + record.expenses, 0);
    const totalNet = totalRevenue - totalExpenses;

    console.log('📊 Financial Summary:');
    console.log(`   Total Revenue: ${totalRevenue.toLocaleString()} SAR`);
    console.log(`   Total Expenses: ${totalExpenses.toLocaleString()} SAR`);
    console.log(`   Net Amount: ${totalNet.toLocaleString()} SAR`);

  } catch (error) {
    console.error('❌ Error seeding Musanad Financial Records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMusanadFinancialRecords();
