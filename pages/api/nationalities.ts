import prisma from "./globalprisma";

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      // 1. Fetch distinct countries from offices
      const offices = await prisma.offices.findMany({
        select: { Country: true },
        orderBy: { Country: 'asc' }
      });

      // 2. Fetch countries from NationalityCard
      const cards: any[] = (await prisma.$queryRawUnsafe(`SELECT countryArabic, countryEnglish FROM NationalityCard`).catch(() => [])) as any[];

      const countryMap = new Map<string, { arabic: string; english: string }>();

      // Seed common countries with Arabic and English
      const defaultCountries = [
        { arabic: 'الهند', english: 'India' },
        { arabic: 'الفلبين', english: 'Philippines' },
        { arabic: 'إندونيسيا', english: 'Indonesia' },
        { arabic: 'سيرلانكا', english: 'Sri Lanka' },
        { arabic: 'كينيا', english: 'Kenya' },
        { arabic: 'إثيوبيا', english: 'Ethiopia' },
        { arabic: 'أوغندا', english: 'Uganda' },
        { arabic: 'بنغلاديش', english: 'Bangladesh' },
        { arabic: 'بوروندي', english: 'Burundi' },
        { arabic: 'باكستان', english: 'Pakistan' },
        { arabic: 'نيجيريا', english: 'Nigeria' },
        { arabic: 'مدغشقر', english: 'Madagascar' },
        { arabic: 'سيراليون', english: 'Sierra Leone' },
        { arabic: 'فيتنام', english: 'Vietnam' },
        { arabic: 'تنزانيا', english: 'Tanzania' },
        { arabic: 'رواندا', english: 'Rwanda' },
        { arabic: 'مصر', english: 'Egypt' },
        { arabic: 'المغرب', english: 'Morocco' },
        { arabic: 'السودان', english: 'Sudan' },
        { arabic: 'اليمن', english: 'Yemen' },
        { arabic: 'الأردن', english: 'Jordan' }
      ];

      defaultCountries.forEach(dc => {
        countryMap.set(dc.arabic, dc);
      });

      // Add from NationalityCard
      cards.forEach(card => {
        const ar = (card.countryArabic || '').trim();
        const en = (card.countryEnglish || '').trim();
        if (ar) {
          countryMap.set(ar, { arabic: ar, english: en });
        }
      });

      // Add from offices table and extract if formatted as "English - Arabic"
      offices.forEach(office => {
        const c = (office.Country || '').trim();
        if (!c) return;
        if (c.includes(' - ')) {
          const parts = c.split(' - ');
          const en = parts[0].trim();
          const ar = parts[1].trim();
          if (ar) {
            countryMap.set(ar, { arabic: ar, english: en });
          }
        } else if (!countryMap.has(c)) {
          countryMap.set(c, { arabic: c, english: '' });
        }
      });

      const activeCountriesSet = new Set<string>();

      // Active from NationalityCard
      cards.forEach(card => {
        const ar = (card.countryArabic || '').trim();
        const en = (card.countryEnglish || '').trim();
        if (ar) {
          const standardName = en ? `${en} - ${ar}` : ar;
          activeCountriesSet.add(standardName);
        }
      });

      // Active from offices
      offices.forEach(office => {
        const c = (office.Country || '').trim();
        if (c) {
          activeCountriesSet.add(c);
        }
      });

      const nationalities = Array.from(countryMap.entries()).map(([_, info], index) => {
        const standardName = info.english ? `${info.english} - ${info.arabic}` : info.arabic;
        return {
          id: index + 1,
          value: standardName,
          label: standardName,
          countryArabic: info.arabic,
          countryEnglish: info.english,
          Country: standardName
        };
      });

      return res.status(200).json({ 
        success: true, 
        nationalities,
        activeCountries: Array.from(activeCountriesSet),
        count: nationalities.length
      });
    } catch (error) {
      console.error('Nationalities API error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  } else if (req.method === 'POST') {
    try {
      const { countryArabic, countryEnglish } = req.body;
      if (!countryArabic || !countryArabic.trim()) {
        return res.status(400).json({ success: false, message: 'اسم الدولة بالعربي مطلوب' });
      }

      const ar = countryArabic.trim();
      const en = (countryEnglish || '').trim();

      // Insert or update in NationalityCard table
      const existing: any[] = (await prisma.$queryRawUnsafe(
        `SELECT id FROM NationalityCard WHERE countryArabic = ? LIMIT 1`,
        ar
      ).catch(() => [])) as any[];

      if (!existing || existing.length === 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO NationalityCard (countryArabic, countryEnglish, flagUrl, price, sortOrder, isActive)
          VALUES (?, ?, '', '0', 99, 1)
        `, ar, en).catch(err => console.error('Insert NationalityCard error:', err));
      } else {
        await prisma.$executeRawUnsafe(`
          UPDATE NationalityCard SET countryEnglish = ? WHERE countryArabic = ?
        `, en, ar).catch(err => console.error('Update NationalityCard error:', err));
      }

      return res.status(201).json({ 
        success: true, 
        countryArabic: ar, 
        countryEnglish: en,
        message: 'تمت إضافة الدولة بنجاح' 
      });
    } catch (error) {
      console.error('Create nationality error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
