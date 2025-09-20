const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedFakeData() {
  try {
    console.log('🌱 Starting to seed fake data...');

    // Seed Offices
    const officesData = [
      { office: 'المكتب 1', password: 'pass123', url: 'http://office1.com', office_id: 'OFF1', Country: 'السعودية', phoneNumber: '123456789' },
      { office: 'المكتب 2', password: 'pass123', url: 'http://office2.com', office_id: 'OFF2', Country: 'السعودية', phoneNumber: '987654321' },
      { office: 'المكتب 3', password: 'pass123', url: 'http://office3.com', office_id: 'OFF3', Country: 'السعودية', phoneNumber: '112233445' }
    ];

    const offices = [];
    for (const data of officesData) {
      const office = await prisma.offices.upsert({
        where: { office: data.office },
        update: {},
        create: data
      });
      offices.push(office);
    }
    console.log(`✅ Seeded ${offices.length} offices`);

    // Seed Clients
    const clientsData = [
      { fullname: 'عبدالله عبدالعزيز الحربي', email: 'client1@example.com', phonenumber: '1234567890', password: 'pass', nationalId: 'ID1', city: 'الرياض', address: 'عنوان 1' },
      { fullname: 'محمد أحمد السعيد', email: 'client2@example.com', phonenumber: '0987654321', password: 'pass', nationalId: 'ID2', city: 'جدة', address: 'عنوان 2' },
      { fullname: 'فاطمة علي محمد', email: 'client3@example.com', phonenumber: '1122334455', password: 'pass', nationalId: 'ID3', city: 'الدمام', address: 'عنوان 3' },
      { fullname: 'أحمد محمد العلي', email: 'client4@example.com', phonenumber: '2233445566', password: 'pass', nationalId: 'ID4', city: 'مكة', address: 'عنوان 4' },
      { fullname: 'نورا عبدالرحمن', email: 'client5@example.com', phonenumber: '3344556677', password: 'pass', nationalId: 'ID5', city: 'المدينة', address: 'عنوان 5' }
    ];

    const clients = [];
    for (const data of clientsData) {
      const client = await prisma.client.upsert({
        where: { email: data.email },
        update: {},
        create: data
      });
      clients.push(client);
    }
    console.log(`✅ Seeded ${clients.length} clients`);

    // Seed Homemaids (simplified)
    const homemaidsData = [
      { Nationalitycopy: 'أوغندا', Name: 'فاطمة أحمد', Religion: 'مسلمة', Passportnumber: 'P123', clientphonenumber: '123', age: 25, job: 'عاملة منزلية' },
      { Nationalitycopy: 'إثيوبيا', Name: 'مريم علي', Religion: 'مسلمة', Passportnumber: 'P456', clientphonenumber: '456', age: 28, job: 'عاملة منزلية' },
      { Nationalitycopy: 'كينيا', Name: 'خديجة محمد', Religion: 'مسلمة', Passportnumber: 'P789', clientphonenumber: '789', age: 30, job: 'عاملة منزلية' }
    ];

    const homemaids = [];
    for (const data of homemaidsData) {
      const homemaid = await prisma.homemaid.create({ data });
      homemaids.push(homemaid);
    }
    console.log(`✅ Seeded ${homemaids.length} homemaids`);

    // Seed Orders
    const ordersData = [
      { ClientName: clients[0].fullname, PhoneNumber: clients[0].phonenumber, clientID: clients[0].id, HomemaidId: homemaids[0].id, bookingstatus: 'مكتمل', profileStatus: 'نشط' },
      { ClientName: clients[1].fullname, PhoneNumber: clients[1].phonenumber, clientID: clients[1].id, HomemaidId: homemaids[1].id, bookingstatus: 'مكتمل', profileStatus: 'نشط' },
      { ClientName: clients[2].fullname, PhoneNumber: clients[2].phonenumber, clientID: clients[2].id, HomemaidId: homemaids[2].id, bookingstatus: 'مكتمل', profileStatus: 'نشط' }
    ];

    const orders = [];
    for (const data of ordersData) {
      const order = await prisma.neworder.create({ data });
      orders.push(order);
    }
    console.log(`✅ Seeded ${orders.length} orders`);

    // Seed Musanad Financial Records (adapted from existing script)
    const sampleRecords = [
      {
        clientId: clients[0].id,
        clientName: clients[0].fullname,
        officeId: offices[0].id,
        officeName: offices[0].office,
        orderId: orders[0].id,
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
        createdBy: 'احمد الحربي'
      },
      // Add more similar to the sample, using the seeded ids
      {
        clientId: clients[1].id,
        clientName: clients[1].fullname,
        officeId: offices[1].id,
        officeName: offices[1].office,
        orderId: orders[1].id,
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
        createdBy: 'احمد الحربي'
      },
      // Add 3-6 more
    ];

    for (const record of sampleRecords) {
      await prisma.musanadFinancialRecord.create({ data: record });
    }
    console.log(`✅ Seeded ${sampleRecords.length} financial records`);

  } catch (error) {
    console.error('❌ Error seeding fake data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedFakeData();
