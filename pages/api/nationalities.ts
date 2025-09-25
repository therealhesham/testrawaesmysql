import prisma from "./globalprisma";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // جلب جميع المكاتب مع الجنسيات
      const offices = await prisma.offices.findMany({
        select: {
          Country: true,
        },
        orderBy: { Country: 'asc' }
      });

      // استخراج الجنسيات الفريدة (غير مكررة)
      const uniqueCountries = [...new Set(offices.map(office => office.Country))];
      
      // تحويل الجنسيات لصيغة مناسبة للقائمة المنسدلة
      const nationalities = uniqueCountries.map((country, index) => ({
        id: index + 1,
        value: country,
        label: country,
        Country: country
      }));

      return res.status(200).json({ 
        success: true, 
        nationalities,
        count: nationalities.length
      });
    } catch (error) {
      console.error('Nationalities API error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  } else {
    // Handle non-GET requests
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
