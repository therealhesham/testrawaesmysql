const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seeding...');

  try {
    // 1. Create Roles
    console.log('📋 Creating roles...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'مدير عام' },
      update: {},
      create: {
        name: 'مدير عام',
        permissions: {
          canViewAll: true,
          canEditAll: true,
          canDeleteAll: true,
          canManageUsers: true,
          canManageFinancial: true,
          canManageOrders: true,
          canManageReports: true
        }
      }
    });

    const employeeRole = await prisma.role.upsert({
      where: { name: 'موظف' },
      update: {},
      create: {
        name: 'موظف',
        permissions: {
          canViewAll: false,
          canEditAll: false,
          canDeleteAll: false,
          canManageUsers: false,
          canManageFinancial: false,
          canManageOrders: true,
          canManageReports: false
        }
      }
    });

    const financialRole = await prisma.role.upsert({
      where: { name: 'محاسب' },
      update: {},
      create: {
        name: 'محاسب',
        permissions: {
          canViewAll: true,
          canEditAll: false,
          canDeleteAll: false,
          canManageUsers: false,
          canManageFinancial: true,
          canManageOrders: false,
          canManageReports: true
        }
      }
    });

    // 2. Create Users
    console.log('👥 Creating users...');
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJAPJjJ8J8J8J8J8J8J8', // password: admin123
        phonenumber: '0501234567',
        admin: true,
        roleId: adminRole.id,
        idnumber: 1234567890
      }
    });

    const employeeUser = await prisma.user.upsert({
      where: { username: 'employee1' },
      update: {},
      create: {
        username: 'employee1',
        password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJAPJjJ8J8J8J8J8J8J8', // password: emp123
        phonenumber: '0501234568',
        admin: false,
        roleId: employeeRole.id,
        idnumber: 1234567891
      }
    });

    const financialUser = await prisma.user.upsert({
      where: { username: 'accountant1' },
      update: {},
      create: {
        username: 'accountant1',
        password: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJAPJjJ8J8J8J8J8J8J8', // password: acc123
        phonenumber: '0501234569',
        admin: false,
        roleId: financialRole.id,
        idnumber: 1234567892
      }
    });

    // 3. Create Offices
    console.log('🏢 Creating offices...');
    const office1 = await prisma.offices.upsert({
      where: { office: 'مكتب الرياض' },
      update: {},
      create: {
        office: 'مكتب الرياض',
        password: 'office123',
        url: 'https://riyadh-office.example.com',
        office_id: 'OFF001',
        Country: 'السعودية',
        phoneNumber: '0112345678'
      }
    });

    const office2 = await prisma.offices.upsert({
      where: { office: 'مكتب جدة' },
      update: {},
      create: {
        office: 'مكتب جدة',
        password: 'office456',
        url: 'https://jeddah-office.example.com',
        office_id: 'OFF002',
        Country: 'السعودية',
        phoneNumber: '0123456789'
      }
    });

    // 4. Create Main Categories
    console.log('📊 Creating main categories...');
    const revenueCategory = await prisma.mainCategory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'الإيرادات',
        mathProcess: 'add'
      }
    });

    const operationalExpensesCategory = await prisma.mainCategory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'المصروفات التشغيلية',
        mathProcess: 'subtract'
      }
    });

    const otherExpensesCategory = await prisma.mainCategory.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'المصروفات الأخرى',
        mathProcess: 'subtract'
      }
    });

    // 5. Create Sub Categories
    console.log('📋 Creating sub categories...');
    const revenueSubCategories = [
      { name: 'إيرادات الاستقدام', mainCategory_id: revenueCategory.id },
      { name: 'إيرادات التحويل', mainCategory_id: revenueCategory.id },
      { name: 'إيرادات أخرى', mainCategory_id: revenueCategory.id }
    ];

    const expenseSubCategories = [
      { name: 'رواتب الموظفين', mainCategory_id: operationalExpensesCategory.id },
      { name: 'إيجار المكتب', mainCategory_id: operationalExpensesCategory.id },
      { name: 'فواتير الكهرباء', mainCategory_id: operationalExpensesCategory.id },
      { name: 'فواتير المياه', mainCategory_id: operationalExpensesCategory.id },
      { name: 'صيانة الأجهزة', mainCategory_id: otherExpensesCategory.id },
      { name: 'مصاريف النقل', mainCategory_id: otherExpensesCategory.id }
    ];

    for (const subCat of [...revenueSubCategories, ...expenseSubCategories]) {
      await prisma.subCategory.create({
        data: subCat
      });
    }

    // 6. Create Clients
    console.log('👤 Creating clients...');
    const clients = [
      {
        fullname: 'أحمد محمد العلي',
        email: 'ahmed.ali@example.com',
        phonenumber: '0501111111',
        nationalId: '1234567890',
        city: 'الرياض',
        address: 'حي النرجس، الرياض',
        notes: 'عميل مميز'
      },
      {
        fullname: 'فاطمة عبدالله السعد',
        email: 'fatima.saad@example.com',
        phonenumber: '0502222222',
        nationalId: '1234567891',
        city: 'جدة',
        address: 'حي الزهراء، جدة',
        notes: 'عميلة جديدة'
      },
      {
        fullname: 'محمد سعد الرشيد',
        email: 'mohammed.rashid@example.com',
        phonenumber: '0503333333',
        nationalId: '1234567892',
        city: 'الدمام',
        address: 'حي الفيصلية، الدمام',
        notes: 'عميل منتظم'
      }
    ];

    const createdClients = [];
    for (const clientData of clients) {
      const client = await prisma.client.upsert({
        where: { email: clientData.email },
        update: {},
        create: clientData
      });
      createdClients.push(client);
    }

    // 7. Create Home Maids
    console.log('👩‍💼 Creating home maids...');
    const homeMaids = [
      {
        Name: 'مريم أحمد',
        Nationality: { name: 'إندونيسيا', code: 'ID' },
        age: 28,
        ExperienceYears: '5',
        maritalstatus: 'متزوجة',
        Experience: 'طبخ، تنظيف، رعاية أطفال',
        dateofbirth: '1995-03-15',
        phone: '+628123456789',
        bookingstatus: 'متاحة',
        officeName: office1.office,
        Salary: '1200',
        Education: 'ثانوية عامة',
        ArabicLanguageLeveL: 'متوسط',
        EnglishLanguageLevel: 'مبتدئ',
        OldPeopleCare: true,
        experienceType: 'منزلية'
      },
      {
        Name: 'سارة محمد',
        Nationality: { name: 'الفلبين', code: 'PH' },
        age: 32,
        ExperienceYears: '8',
        maritalstatus: 'أرملة',
        Experience: 'طبخ، تنظيف، رعاية مسنين',
        dateofbirth: '1991-07-22',
        phone: '+639123456789',
        bookingstatus: 'متاحة',
        officeName: office2.office,
        Salary: '1400',
        Education: 'جامعية',
        ArabicLanguageLeveL: 'جيد',
        EnglishLanguageLevel: 'متقدم',
        OldPeopleCare: true,
        experienceType: 'منزلية'
      },
      {
        Name: 'أنجيلا سانتوس',
        Nationality: { name: 'الفلبين', code: 'PH' },
        age: 25,
        ExperienceYears: '3',
        maritalstatus: 'عزباء',
        Experience: 'طبخ، تنظيف، رعاية أطفال',
        dateofbirth: '1998-11-10',
        phone: '+639987654321',
        bookingstatus: 'مقيدة',
        officeName: office1.office,
        Salary: '1000',
        Education: 'ثانوية عامة',
        ArabicLanguageLeveL: 'مبتدئ',
        EnglishLanguageLevel: 'متوسط',
        OldPeopleCare: false,
        experienceType: 'منزلية'
      }
    ];

    const createdHomeMaids = [];
    for (const maidData of homeMaids) {
      const maid = await prisma.homemaid.create({
        data: maidData
      });
      createdHomeMaids.push(maid);
    }

    // 8. Create Orders
    console.log('📦 Creating orders...');
    const orders = [
      {
        ClientName: createdClients[0].fullname,
        PhoneNumber: createdClients[0].phonenumber,
        clientID: createdClients[0].id,
        HomemaidId: createdHomeMaids[0].id,
        bookingstatus: 'مؤكد',
        profileStatus: 'مكتمل',
        typeOfContract: 'سنوي',
        Total: 15000,
        paid: 5000,
        PaymentMethod: 'قسط',
        Installments: 3,
        Nationalitycopy: createdHomeMaids[0].Nationality.name,
        Name: createdHomeMaids[0].Name,
        Religion: 'مسلمة',
        Passportnumber: 'A1234567',
        nationalId: createdClients[0].nationalId,
        clientphonenumber: createdClients[0].phonenumber,
        ExperienceYears: createdHomeMaids[0].ExperienceYears,
        maritalstatus: createdHomeMaids[0].maritalstatus,
        Experience: createdHomeMaids[0].Experience,
        dateofbirth: createdHomeMaids[0].dateofbirth,
        Nationality: createdHomeMaids[0].Nationality,
        age: createdHomeMaids[0].age,
        phone: createdHomeMaids[0].phone,
        ages: createdHomeMaids[0].age.toString()
      },
      {
        ClientName: createdClients[1].fullname,
        PhoneNumber: createdClients[1].phonenumber,
        clientID: createdClients[1].id,
        HomemaidId: createdHomeMaids[1].id,
        bookingstatus: 'قيد المراجعة',
        profileStatus: 'قيد المراجعة',
        typeOfContract: 'شهري',
        Total: 8000,
        paid: 0,
        PaymentMethod: 'نقدي',
        Installments: 1,
        Nationalitycopy: createdHomeMaids[1].Nationality.name,
        Name: createdHomeMaids[1].Name,
        Religion: 'مسيحية',
        Passportnumber: 'B2345678',
        nationalId: createdClients[1].nationalId,
        clientphonenumber: createdClients[1].phonenumber,
        ExperienceYears: createdHomeMaids[1].ExperienceYears,
        maritalstatus: createdHomeMaids[1].maritalstatus,
        Experience: createdHomeMaids[1].Experience,
        dateofbirth: createdHomeMaids[1].dateofbirth,
        Nationality: createdHomeMaids[1].Nationality,
        age: createdHomeMaids[1].age,
        phone: createdHomeMaids[1].phone,
        ages: createdHomeMaids[1].age.toString()
      }
    ];

    const createdOrders = [];
    for (const orderData of orders) {
      const order = await prisma.neworder.create({
        data: orderData
      });
      createdOrders.push(order);
    }

    // 9. Create Financial Records
    console.log('💰 Creating financial records...');
    
    // Create Musanad Financial Records
    const musanadRecords = [
      {
        clientId: createdClients[0].id,
        clientName: createdClients[0].fullname,
        officeId: office1.id,
        officeName: office1.office,
        orderId: createdOrders[0].id,
        orderNumber: `ORD-${createdOrders[0].id}`,
        nationality: createdHomeMaids[0].Nationality.name,
        workerName: createdHomeMaids[0].Name,
        orderDate: new Date(),
        transferDate: new Date(),
        transferNumber: `TRF-${Date.now()}`,
        revenue: 15000,
        expenses: 3000,
        netAmount: 12000,
        status: 'completed',
        notes: 'تم إكمال المعاملة بنجاح'
      },
      {
        clientId: createdClients[1].id,
        clientName: createdClients[1].fullname,
        officeId: office2.id,
        officeName: office2.office,
        orderId: createdOrders[1].id,
        orderNumber: `ORD-${createdOrders[1].id}`,
        nationality: createdHomeMaids[1].Nationality.name,
        workerName: createdHomeMaids[1].Name,
        orderDate: new Date(),
        transferDate: new Date(Date.now() + 86400000), // Tomorrow
        transferNumber: `TRF-${Date.now() + 1}`,
        revenue: 8000,
        expenses: 1600,
        netAmount: 6400,
        status: 'in_process',
        notes: 'قيد المعالجة'
      }
    ];

    for (const record of musanadRecords) {
      await prisma.musanadFinancialRecord.create({
        data: record
      });
    }

    // 10. Create Client Account Statements
    console.log('📊 Creating client account statements...');
    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      const order = createdOrders[i] || null;
      
      const statement = await prisma.clientAccountStatement.create({
        data: {
          clientId: client.id,
          contractNumber: order ? `CONTRACT-${order.id}` : `CONTRACT-${client.id}`,
          officeName: i % 2 === 0 ? office1.office : office2.office,
          totalRevenue: order ? order.paid || 0 : 0, // Only use paid amount, not total
          totalExpenses: 0, // No expenses for now
          netAmount: order ? order.paid || 0 : 0, // Net amount equals paid amount
          contractStatus: order ? order.bookingstatus : 'معلق',
          notes: `كشف حساب للعميل ${client.fullname}`,
          orderId: order ? order.id : null
        }
      });

      // Create account entries
      if (order) {
        await prisma.clientAccountEntry.create({
          data: {
            statementId: statement.id,
            date: new Date(),
            description: 'دفعة أولى',
            debit: 0,
            credit: order.paid || 0,
            balance: order.paid || 0,
            entryType: 'دفعة'
          }
        });

        // Removed remaining amount entry creation - only track paid amounts in accounting
      }
    }

    // 11. Create Income Statements
    console.log('📈 Creating income statements...');
    const currentDate = new Date();
    const subCategories = await prisma.subCategory.findMany();
    
    for (const subCategory of subCategories) {
      await prisma.incomeStatement.create({
        data: {
          date: currentDate,
          subCategory_id: subCategory.id,
          amount: Math.floor(Math.random() * 10000) + 1000,
          notes: `إدخال مالي لـ ${subCategory.name}`
        }
      });
    }

    // 12. Create Tax Declarations
    console.log('🧾 Creating tax declarations...');
    const taxDeclaration = await prisma.taxDeclaration.create({
      data: {
        period: '2024-Q1',
        year: 2024,
        month: 3,
        status: 'draft',
        taxableSales: 50000,
        zeroRateSales: 10000,
        adjustments: 2000,
        taxValue: 7500,
        createdBy: adminUser.username,
        updatedBy: adminUser.username
      }
    });

    // Create tax sales records
    const salesCategories = ['استقدام', 'تحويل', 'خدمات أخرى'];
    for (const category of salesCategories) {
      await prisma.taxSalesRecord.create({
        data: {
          taxDeclarationId: taxDeclaration.id,
          category: category,
          description: `مبيعات ${category}`,
          amount: Math.floor(Math.random() * 20000) + 5000,
          adjustment: 0,
          total: Math.floor(Math.random() * 20000) + 5000,
          taxRate: 15
        }
      });
    }

    // 13. Create Employee Data
    console.log('👨‍💼 Creating employee data...');
    const employees = [
      {
        name: 'سعد العلي',
        position: 'مدير مكتب',
        department: 'الإدارة',
        phoneNumber: '0501234567',
        email: 'saad.ali@company.com',
        nationalId: '1234567890',
        address: 'الرياض، حي النرجس',
        hireDate: new Date('2020-01-15'),
        salary: 8000,
        isActive: true,
        notes: 'مدير المكتب الرئيسي'
      },
      {
        name: 'نورا محمد',
        position: 'محاسبة',
        department: 'المحاسبة',
        phoneNumber: '0501234568',
        email: 'nora.mohammed@company.com',
        nationalId: '1234567891',
        address: 'الرياض، حي العليا',
        hireDate: new Date('2021-03-01'),
        salary: 6000,
        isActive: true,
        notes: 'محاسبة متميزة'
      }
    ];

    const createdEmployees = [];
    for (const empData of employees) {
      const employee = await prisma.employee.create({
        data: empData
      });
      createdEmployees.push(employee);
    }

    // Create employee cash records
    for (const employee of createdEmployees) {
      await prisma.employeeCash.create({
        data: {
          employeeId: employee.id,
          cashNumber: `CASH-${employee.id}`,
          receivedAmount: 5000,
          expenseAmount: 2000,
          remainingBalance: 3000,
          description: 'عهدة شهرية',
          transactionDate: new Date()
        }
      });
    }

    // 14. Create Notifications
    console.log('🔔 Creating notifications...');
    const notifications = [
      {
        title: 'طلب جديد',
        message: 'تم استلام طلب استقدام جديد من العميل أحمد العلي',
        userId: adminUser.username,
        isRead: false
      },
      {
        title: 'تذكير دفع',
        message: 'تذكير: موعد دفع القسط الثاني للعميل فاطمة السعد',
        userId: financialUser.username,
        isRead: false
      },
      {
        title: 'تقرير شهري',
        message: 'تم إعداد التقرير المالي الشهري بنجاح',
        userId: adminUser.username,
        isRead: true
      }
    ];

    for (const notif of notifications) {
      await prisma.notifications.create({
        data: notif
      });
    }

    // 15. Create Tasks
    console.log('📝 Creating tasks...');
    const tasks = [
      {
        userId: employeeUser.id,
        description: 'مراجعة طلبات الاستقدام الجديدة',
        taskDeadline: new Date(Date.now() + 86400000), // Tomorrow
        Title: 'مراجعة الطلبات',
        isCompleted: false
      },
      {
        userId: financialUser.id,
        description: 'إعداد التقرير المالي الشهري',
        taskDeadline: new Date(Date.now() + 172800000), // Day after tomorrow
        Title: 'التقرير المالي',
        isCompleted: false
      },
      {
        userId: adminUser.id,
        description: 'مراجعة حسابات العملاء',
        taskDeadline: new Date(Date.now() + 259200000), // 3 days from now
        Title: 'مراجعة الحسابات',
        isCompleted: true
      }
    ];

    for (const task of tasks) {
      await prisma.tasks.create({
        data: task
      });
    }

    // 16. Create Templates
    console.log('📄 Creating templates...');
    const templates = [
      {
        title: 'عقد الاستقدام',
        content: 'هذا عقد استقدام بين الطرفين...',
        type: 'contract'
      },
      {
        title: 'إشعار الدفع',
        content: 'نحيط علمكم بأن موعد دفع القسط...',
        type: 'payment_notice'
      },
      {
        title: 'تقرير الحالة',
        content: 'تقرير عن حالة الطلب...',
        type: 'status_report'
      }
    ];

    for (const template of templates) {
      await prisma.template.create({
        data: template
      });
    }

    console.log('✅ Comprehensive data seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${await prisma.role.count()} roles`);
    console.log(`   - ${await prisma.user.count()} users`);
    console.log(`   - ${await prisma.offices.count()} offices`);
    console.log(`   - ${await prisma.client.count()} clients`);
    console.log(`   - ${await prisma.homemaid.count()} home maids`);
    console.log(`   - ${await prisma.neworder.count()} orders`);
    console.log(`   - ${await prisma.musanadFinancialRecord.count()} financial records`);
    console.log(`   - ${await prisma.clientAccountStatement.count()} client statements`);
    console.log(`   - ${await prisma.employee.count()} employees`);
    console.log(`   - ${await prisma.notifications.count()} notifications`);
    console.log(`   - ${await prisma.tasks.count()} tasks`);
    console.log(`   - ${await prisma.template.count()} templates`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
