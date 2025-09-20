const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedClientAccounts() {
  try {
    console.log('🌱 Starting to seed client accounts data...');

    // First, ensure we have some clients
    const existingClients = await prisma.client.findMany();
    if (existingClients.length === 0) {
      console.log('Creating sample clients...');
      const clientsData = [
        { fullname: 'عبدالله عبدالعزيز الحربي', email: 'client1@example.com', phonenumber: '1234567890', password: 'pass', nationalId: 'ID1', city: 'الرياض', address: 'عنوان 1' },
        { fullname: 'محمد أحمد السعيد', email: 'client2@example.com', phonenumber: '0987654321', password: 'pass', nationalId: 'ID2', city: 'جدة', address: 'عنوان 2' },
        { fullname: 'فاطمة علي محمد', email: 'client3@example.com', phonenumber: '1122334455', password: 'pass', nationalId: 'ID3', city: 'الدمام', address: 'عنوان 3' },
        { fullname: 'أحمد محمد العلي', email: 'client4@example.com', phonenumber: '2233445566', password: 'pass', nationalId: 'ID4', city: 'مكة', address: 'عنوان 4' },
        { fullname: 'نورا عبدالرحمن', email: 'client5@example.com', phonenumber: '3344556677', password: 'pass', nationalId: 'ID5', city: 'المدينة', address: 'عنوان 5' },
        { fullname: 'سارة عبدالله القحطاني', email: 'client6@example.com', phonenumber: '4455667788', password: 'pass', nationalId: 'ID6', city: 'الرياض', address: 'عنوان 6' },
        { fullname: 'خالد سعد المطيري', email: 'client7@example.com', phonenumber: '5566778899', password: 'pass', nationalId: 'ID7', city: 'جدة', address: 'عنوان 7' },
        { fullname: 'منى عبدالرحمن الشمري', email: 'client8@example.com', phonenumber: '6677889900', password: 'pass', nationalId: 'ID8', city: 'الدمام', address: 'عنوان 8' }
      ];

      for (const data of clientsData) {
        await prisma.client.upsert({
          where: { email: data.email },
          update: {},
          create: data
        });
      }
    }

    const clients = await prisma.client.findMany();
    console.log(`✅ Found ${clients.length} clients`);

    // Sample office names
    const officeNames = [
      'مكتب الرياض للاستقدام',
      'مكتب جدة للخدمات',
      'مكتب الدمام الدولي',
      'مكتب مكة المكرمة',
      'مكتب المدينة المنورة',
      'مكتب الخبر للاستقدام',
      'مكتب الطائف للخدمات',
      'مكتب تبوك الدولي'
    ];

    // Sample contract statuses
    const contractStatuses = [
      'نشط',
      'مكتمل',
      'معلق',
      'ملغي',
      'قيد المراجعة',
      'منتهي'
    ];

    // Sample notes
    const notes = [
      'عقد مكتمل بنجاح',
      'في انتظار المراجعة',
      'يحتاج متابعة',
      'تم الإلغاء بناء على طلب العميل',
      'عقد نشط',
      'منتهي الصلاحية',
      'قيد التنفيذ',
      null
    ];

    // Generate fake client account statements
    const statementsData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 25; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const officeName = officeNames[Math.floor(Math.random() * officeNames.length)];
      const contractStatus = contractStatuses[Math.floor(Math.random() * contractStatuses.length)];
      const note = notes[Math.floor(Math.random() * notes.length)];
      
      // Generate random dates within the last 6 months
      const randomDays = Math.floor(Math.random() * 180);
      const createdAt = new Date(currentDate.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      // Generate realistic financial amounts
      const totalRevenue = Math.floor(Math.random() * 15000) + 3000; // 3000-18000
      const totalExpenses = Math.floor(Math.random() * 8000) + 1000; // 1000-9000
      const netAmount = totalRevenue - totalExpenses;
      
      const contractNumber = `CON-${String(i + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
      
      statementsData.push({
        clientId: client.id,
        contractNumber,
        officeName,
        totalRevenue,
        totalExpenses,
        netAmount,
        contractStatus,
        notes: note,
        createdAt
      });
    }

    // Create the statements
    console.log('Creating client account statements...');
    for (const statementData of statementsData) {
      const statement = await prisma.clientAccountStatement.create({
        data: statementData
      });

      // Create 2-5 entries for each statement
      const numEntries = Math.floor(Math.random() * 4) + 2;
      const entryTypes = ['إيراد', 'مصروف', 'تحويل', 'عمولة', 'ضريبة'];
      const descriptions = [
        'رسوم العقد',
        'رسوم التأشيرة',
        'رسوم الطيران',
        'رسوم الفحص الطبي',
        'رسوم الإقامة',
        'تحويل مبلغ',
        'عمولة المكتب',
        'ضريبة القيمة المضافة',
        'رسوم إضافية',
        'استرداد مبلغ'
      ];

      let runningBalance = 0;
      
      for (let j = 0; j < numEntries; j++) {
        const entryDate = new Date(statement.createdAt.getTime() + (j * 24 * 60 * 60 * 1000));
        const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        let debit = 0;
        let credit = 0;
        
        if (entryType === 'إيراد' || entryType === 'تحويل') {
          credit = Math.floor(Math.random() * 5000) + 500;
        } else {
          debit = Math.floor(Math.random() * 3000) + 200;
        }
        
        runningBalance += credit - debit;
        
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: entryDate,
            description: `${description} - ${entryType}`,
            debit,
            credit,
            balance: runningBalance,
            entryType
          }
        });
      }
    }

    console.log(`✅ Created ${statementsData.length} client account statements with entries`);

    // Create some foreign offices for the filter
    const foreignOfficesData = [
      { office: 'مكتب نيروبي للاستقدام', Country: 'كينيا', phoneNumber: '+254123456789' },
      { office: 'مكتب أديس أبابا للخدمات', Country: 'إثيوبيا', phoneNumber: '+251987654321' },
      { office: 'مكتب كامبالا الدولي', Country: 'أوغندا', phoneNumber: '+256112233445' },
      { office: 'مكتب دكا للاستقدام', Country: 'بنغلاديش', phoneNumber: '+880223344556' },
      { office: 'مكتب مانيلا للخدمات', Country: 'الفلبين', phoneNumber: '+6333445566' }
    ];

    for (const officeData of foreignOfficesData) {
      await prisma.offices.upsert({
        where: { office: officeData.office },
        update: {},
        create: {
          ...officeData,
          password: 'pass123',
          url: `http://${officeData.office.replace(/\s+/g, '').toLowerCase()}.com`,
          office_id: `OFF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        }
      });
    }

    console.log(`✅ Created ${foreignOfficesData.length} foreign offices`);

    console.log('🎉 Client accounts data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${statementsData.length} account statements`);
    console.log(`   - ${foreignOfficesData.length} foreign offices`);
    console.log('   - Multiple entries per statement');

  } catch (error) {
    console.error('❌ Error seeding client accounts data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClientAccounts();
