import prisma from './prisma';

export async function checkDatabaseHealth() {
  try {
    // Test basic connection
    await prisma.$connect();
    
    // Test a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Database connection is working'
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testHomemaidQuery() {
  try {
    const count = await prisma.homemaid.count();
    return {
      success: true,
      count,
      message: `Found ${count} homemaids in database`
    };
  } catch (error) {
    console.error('Homemaid query test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
