/**
 * Maps country name or nationality string to ISO 2-letter country code.
 */
export const getCountryCode = (countryOrNationality?: string | null): string => {
  if (!countryOrNationality) return '';
  const text = countryOrNationality.toLowerCase().trim();

  if (text.includes('kenya') || text.includes('كينيا') || text.includes('كيني')) return 'ke';
  if (text.includes('ethiopia') || text.includes('إثيوبيا') || text.includes('اثيوبيا') || text.includes('إثيوبي') || text.includes('اثيوبي')) return 'et';
  if (text.includes('bangladesh') || text.includes('بنغلاديش') || text.includes('بنقلاديش') || text.includes('بنغلادش') || text.includes('بنغالي') || text.includes('بنغالية')) return 'bd';
  if (text.includes('uganda') || text.includes('أوغندا') || text.includes('اوغندا') || text.includes('أوغندي') || text.includes('اوغندي') || text.includes('اوغندية') || text.includes('أوغندية')) return 'ug';
  if (text.includes('philippines') || text.includes('فلبين') || text.includes('الفلبين') || text.includes('فلبيني') || text.includes('فلبينية')) return 'ph';
  if (text.includes('sri lanka') || text.includes('سيرلانكا') || text.includes('سريلانكا') || text.includes('سيلان') || text.includes('سيرلانكي') || text.includes('سريلانكية')) return 'lk';
  if (text.includes('india') || text.includes('هند') || text.includes('الهند') || text.includes('هندي') || text.includes('هندية')) return 'in';
  if (text.includes('indonesia') || text.includes('إندونيسيا') || text.includes('اندونيسيا') || text.includes('إندونيسي') || text.includes('اندونيسية')) return 'id';
  if (text.includes('burundi') || text.includes('بوروندي') || text.includes('بورندي') || text.includes('بوروندية')) return 'bi';
  if (text.includes('pakistan') || text.includes('باكستان') || text.includes('باكستاني') || text.includes('باكستانية')) return 'pk';
  if (text.includes('madagascar') || text.includes('مدغشقر')) return 'mg';
  if (text.includes('sierra leone') || text.includes('سيراليون')) return 'sl';
  if (text.includes('nigeria') || text.includes('نيجيريا') || text.includes('نيجيري') || text.includes('نيجيرية')) return 'ng';
  if (text.includes('vietnam') || text.includes('فيتنام') || text.includes('فيتنامي') || text.includes('فيتنامية')) return 'vn';
  if (text.includes('tanzania') || text.includes('تنزانيا') || text.includes('تنزاني') || text.includes('تنزانية')) return 'tz';
  if (text.includes('rwanda') || text.includes('رواندا') || text.includes('رواندي') || text.includes('رواندية')) return 'rw';
  if (text.includes('morocco') || text.includes('المغرب') || text.includes('مغربي') || text.includes('مغربية')) return 'ma';
  if (text.includes('egypt') || text.includes('مصر') || text.includes('مصري') || text.includes('مصرية')) return 'eg';
  if (text.includes('sudan') || text.includes('السودان') || text.includes('سودان') || text.includes('سوداني') || text.includes('سودانية')) return 'sd';
  if (text.includes('saudi') || text.includes('سعودي') || text.includes('السعودية') || text.includes('سعودية')) return 'sa';
  if (text.includes('yemen') || text.includes('اليمن') || text.includes('يمني') || text.includes('يمنية')) return 'ye';
  if (text.includes('jordan') || text.includes('الأردن') || text.includes('الاردن') || text.includes('أردني') || text.includes('أردنية')) return 'jo';

  return '';
};

/**
 * Returns flag image URL (flagcdn) for reliable cross-platform rendering (fixes Windows emoji limitation).
 */
export const getCountryFlagUrl = (countryOrNationality?: string | null): string => {
  const code = getCountryCode(countryOrNationality);
  if (!code) return '';
  return `https://flagcdn.com/w40/${code}.png`;
};

/**
 * Fallback Unicode emoji
 */
export const getCountryFlagEmoji = (countryOrNationality?: string | null): string => {
  const code = getCountryCode(countryOrNationality);
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};
