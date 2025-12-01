/**
 * Script to add Complaints Management permissions to existing roles
 * Run this script after deploying the complaints system
 * 
 * Usage: node scripts/add-complaints-permissions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addComplaintsPermissions() {
  try {
    console.log('🚀 Starting to add complaints permissions...\n');

    // Get all roles
    const roles = await prisma.role.findMany();
    console.log(`📋 Found ${roles.length} roles\n`);

    // Define which roles should have complaints management permissions
    const itRoles = ['IT', 'مدير تقني', 'دعم فني', 'IT Support', 'Technical Manager'];
    
    for (const role of roles) {
      const permissions = role.permissions || {};
      
      // Check if this role should have IT permissions
      const shouldHaveITPermissions = itRoles.some(itRole => 
        role.name.toLowerCase().includes(itRole.toLowerCase())
      );

      // Add complaints permissions if not exists
      if (!permissions['إدارة الشكاوى']) {
        permissions['إدارة الشكاوى'] = {
          'عرض': true,
          'حل': shouldHaveITPermissions, // Only IT roles can resolve
        };

        await prisma.role.update({
        where: { id: role.id },
          data: { permissions }
        });

        console.log(`✅ Updated role: ${role.name}`);
        console.log(`   - Can view complaints: ✓`);
        console.log(`   - Can resolve complaints: ${shouldHaveITPermissions ? '✓' : '✗'}\n`);
      } else {
        console.log(`⏭️  Role "${role.name}" already has complaints permissions\n`);
      }
    }

    console.log('✨ Complaints permissions added successfully!\n');
    console.log('📝 Summary:');
    console.log('   - All users can now view and create their own complaints');
    console.log('   - IT roles can view and resolve all complaints');
    console.log('   - Notifications will be sent to IT users when new complaints are created\n');

  } catch (error) {
    console.error('❌ Error adding complaints permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addComplaintsPermissions()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

