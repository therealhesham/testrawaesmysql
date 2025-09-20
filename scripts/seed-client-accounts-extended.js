const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedExtendedClientAccounts() {
  try {
    console.log('🌱 Starting to seed extended client accounts data...');

    // Create more diverse clients
    const extendedClientsData = [
      { fullname: 'عبدالله عبدالعزيز الحربي', email: 'client1@example.com', phonenumber: '1234567890', password: 'pass', nationalId: 'ID1', city: 'الرياض', address: 'حي النرجس، الرياض' },
      { fullname: 'محمد أحمد السعيد', email: 'client2@example.com', phonenumber: '0987654321', password: 'pass', nationalId: 'ID2', city: 'جدة', address: 'حي الروضة، جدة' },
      { fullname: 'فاطمة علي محمد', email: 'client3@example.com', phonenumber: '1122334455', password: 'pass', nationalId: 'ID3', city: 'الدمام', address: 'حي الفيصلية، الدمام' },
      { fullname: 'أحمد محمد العلي', email: 'client4@example.com', phonenumber: '2233445566', password: 'pass', nationalId: 'ID4', city: 'مكة', address: 'حي العزيزية، مكة' },
      { fullname: 'نورا عبدالرحمن', email: 'client5@example.com', phonenumber: '3344556677', password: 'pass', nationalId: 'ID5', city: 'المدينة', address: 'حي قباء، المدينة' },
      { fullname: 'سارة عبدالله القحطاني', email: 'client6@example.com', phonenumber: '4455667788', password: 'pass', nationalId: 'ID6', city: 'الرياض', address: 'حي الملز، الرياض' },
      { fullname: 'خالد سعد المطيري', email: 'client7@example.com', phonenumber: '5566778899', password: 'pass', nationalId: 'ID7', city: 'جدة', address: 'حي الزهراء، جدة' },
      { fullname: 'منى عبدالرحمن الشمري', email: 'client8@example.com', phonenumber: '6677889900', password: 'pass', nationalId: 'ID8', city: 'الدمام', address: 'حي الشاطئ، الدمام' },
      { fullname: 'عبدالرحمن محمد الغامدي', email: 'client9@example.com', phonenumber: '7788990011', password: 'pass', nationalId: 'ID9', city: 'الطائف', address: 'حي العزيزية، الطائف' },
      { fullname: 'هند عبدالعزيز العتيبي', email: 'client10@example.com', phonenumber: '8899001122', password: 'pass', nationalId: 'ID10', city: 'تبوك', address: 'حي الملك فهد، تبوك' },
      { fullname: 'عبدالعزيز سعد الدوسري', email: 'client11@example.com', phonenumber: '9900112233', password: 'pass', nationalId: 'ID11', city: 'الخبر', address: 'حي الراكة، الخبر' },
      { fullname: 'مريم عبدالله الزهراني', email: 'client12@example.com', phonenumber: '0011223344', password: 'pass', nationalId: 'ID12', city: 'الأحساء', address: 'حي النزهة، الأحساء' }
    ];

    // Upsert clients
    for (const data of extendedClientsData) {
      await prisma.client.upsert({
        where: { email: data.email },
        update: {},
        create: data
      });
    }

    const clients = await prisma.client.findMany();
    console.log(`✅ Found/Upserted ${clients.length} clients`);

    // Extended office names with more variety
    const officeNames = [
      'مكتب الرياض للاستقدام',
      'مكتب جدة للخدمات',
      'مكتب الدمام الدولي',
      'مكتب مكة المكرمة',
      'مكتب المدينة المنورة',
      'مكتب الخبر للاستقدام',
      'مكتب الطائف للخدمات',
      'مكتب تبوك الدولي',
      'مكتب الأحساء للخدمات',
      'مكتب القصيم للاستقدام',
      'مكتب حائل للخدمات',
      'مكتب الباحة الدولي'
    ];

    // More diverse contract statuses
    const contractStatuses = [
      'نشط',
      'مكتمل',
      'معلق',
      'ملغي',
      'قيد المراجعة',
      'منتهي',
      'قيد التنفيذ',
      'في الانتظار',
      'مرفوض',
      'مؤجل'
    ];

    // More realistic notes
    const notes = [
      'عقد مكتمل بنجاح - تم تسليم العامل',
      'في انتظار المراجعة النهائية',
      'يحتاج متابعة من العميل',
      'تم الإلغاء بناء على طلب العميل',
      'عقد نشط - العامل في الخدمة',
      'منتهي الصلاحية - انتهت فترة الضمان',
      'قيد التنفيذ - في مرحلة التأشيرة',
      'في الانتظار - انتظار الموافقة',
      'مرفوض - عدم استيفاء الشروط',
      'مؤجل - بناء على طلب العميل',
      'تم التوقيع - في انتظار التنفيذ',
      'قيد المراجعة - مراجعة الوثائق',
      null
    ];

    // Generate more diverse financial data
    const statementsData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 50; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const officeName = officeNames[Math.floor(Math.random() * officeNames.length)];
      const contractStatus = contractStatuses[Math.floor(Math.random() * contractStatuses.length)];
      const note = notes[Math.floor(Math.random() * notes.length)];
      
      // Generate random dates within the last 12 months
      const randomDays = Math.floor(Math.random() * 365);
      const createdAt = new Date(currentDate.getTime() - (randomDays * 24 * 60 * 60 * 1000));
      
      // Generate more realistic financial amounts based on contract status
      let totalRevenue, totalExpenses, netAmount;
      
      if (contractStatus === 'مكتمل' || contractStatus === 'نشط') {
        totalRevenue = Math.floor(Math.random() * 20000) + 5000; // 5000-25000
        totalExpenses = Math.floor(Math.random() * 12000) + 2000; // 2000-14000
      } else if (contractStatus === 'ملغي' || contractStatus === 'مرفوض') {
        totalRevenue = Math.floor(Math.random() * 5000) + 1000; // 1000-6000
        totalExpenses = Math.floor(Math.random() * 3000) + 500; // 500-3500
      } else {
        totalRevenue = Math.floor(Math.random() * 15000) + 3000; // 3000-18000
        totalExpenses = Math.floor(Math.random() * 8000) + 1000; // 1000-9000
      }
      
      netAmount = totalRevenue - totalExpenses;
      
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
    console.log('Creating extended client account statements...');
    for (const statementData of statementsData) {
      const statement = await prisma.clientAccountStatement.create({
        data: statementData
      });

      // Create 3-8 entries for each statement
      const numEntries = Math.floor(Math.random() * 6) + 3;
      const entryTypes = ['إيراد', 'مصروف', 'تحويل', 'عمولة', 'ضريبة', 'استرداد', 'خصم', 'إضافة'];
      const descriptions = [
        'رسوم العقد الأساسية',
        'رسوم التأشيرة',
        'رسوم الطيران',
        'رسوم الفحص الطبي',
        'رسوم الإقامة',
        'تحويل مبلغ للعميل',
        'عمولة المكتب',
        'ضريبة القيمة المضافة',
        'رسوم إضافية',
        'استرداد مبلغ',
        'خصم تأخير',
        'إضافة خدمات',
        'رسوم الترجمة',
        'رسوم التوثيق',
        'رسوم الشحن',
        'رسوم التأمين'
      ];

      let runningBalance = 0;
      
      for (let j = 0; j < numEntries; j++) {
        const entryDate = new Date(statement.createdAt.getTime() + (j * 24 * 60 * 60 * 1000));
        const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        let debit = 0;
        let credit = 0;
        
        if (entryType === 'إيراد' || entryType === 'تحويل' || entryType === 'استرداد') {
          credit = Math.floor(Math.random() * 8000) + 500;
        } else {
          debit = Math.floor(Math.random() * 5000) + 200;
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

    console.log(`✅ Created ${statementsData.length} extended client account statements with entries`);

    // Create more foreign offices
    const foreignOfficesData = [
      { office: 'مكتب نيروبي للاستقدام', Country: 'كينيا', phoneNumber: '+254123456789' },
      { office: 'مكتب أديس أبابا للخدمات', Country: 'إثيوبيا', phoneNumber: '+251987654321' },
      { office: 'مكتب كامبالا الدولي', Country: 'أوغندا', phoneNumber: '+256112233445' },
      { office: 'مكتب دكا للاستقدام', Country: 'بنغلاديش', phoneNumber: '+880223344556' },
      { office: 'مكتب مانيلا للخدمات', Country: 'الفلبين', phoneNumber: '+6333445566' },
      { office: 'مكتب جاكرتا للاستقدام', Country: 'إندونيسيا', phoneNumber: '+622123456789' },
      { office: 'مكتب كولومبو للخدمات', Country: 'سريلانكا', phoneNumber: '+94112345678' },
      { office: 'مكتب كاتماندو الدولي', Country: 'نيبال', phoneNumber: '+977123456789' }
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

    console.log(`✅ Created/Upserted ${foreignOfficesData.length} foreign offices`);

    console.log('🎉 Extended client accounts data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${statementsData.length} account statements`);
    console.log(`   - ${foreignOfficesData.length} foreign offices`);
    console.log('   - Multiple entries per statement (3-8 entries each)');
    console.log('   - Diverse contract statuses and financial amounts');
    console.log('   - Realistic Arabic names and addresses');

  } catch (error) {
    console.error('❌ Error seeding extended client accounts data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedExtendedClientAccounts();
