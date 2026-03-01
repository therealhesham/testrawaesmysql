import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const Name = "123"; // Test string
  const filters: any = {};
  
  if(Name){
    if (!filters.OR) filters.OR = [];
    filters.OR.push(
      { Name: { contains: Name.toLowerCase() } },
      { Passportnumber: { contains: Name.toLowerCase() } }
    );
  }
  
  const results = await prisma.homemaid.findMany({
    where: filters,
    take: 5,
    select: { id: true, Name: true, Passportnumber: true }
  });
  
  console.log("Results with OR:", results);
}

main().catch(console.error).finally(() => prisma.$disconnect());
