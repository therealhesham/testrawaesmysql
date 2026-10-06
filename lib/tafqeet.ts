/**
 * دالة تفقيط المبالغ والأرقام وتحويلها إلى كلمات باللغة العربية
 * Tafqeet: Convert numbers to Arabic written words with currency
 */

export interface TafqeetOptions {
  currency?: string;
  subCurrency?: string;
  prefix?: string;
  suffix?: string;
}

export function tafqeet(input: number | string | null | undefined, options: TafqeetOptions = {}): string {
  if (input === null || input === undefined || input === '') return '';
  const num = typeof input === 'string' ? parseFloat(input.replace(/,/g, '')) : input;
  if (isNaN(num)) return '';
  if (num === 0) return 'صفر ريال سعودي';

  const {
    currency = 'ريال سعودي',
    subCurrency = 'هللة',
    prefix = 'فقط',
    suffix = 'لا غير',
  } = options;

  const ones = [
    '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
    'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
  ];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = [
    '', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
  ];

  function convertGroup(val: number): string {
    if (val === 0) return '';
    let res = '';
    const h = Math.floor(val / 100);
    const rem = val % 100;

    if (h > 0) {
      res += hundreds[h];
    }

    if (rem > 0) {
      if (res !== '') res += ' و';
      if (rem < 20) {
        res += ones[rem];
      } else {
        const o = rem % 10;
        const t = Math.floor(rem / 10);
        if (o > 0) {
          res += ones[o] + ' و' + tens[t];
        } else {
          res += tens[t];
        }
      }
    }
    return res;
  }

  const parts = num.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let result = '';

  const billions = Math.floor(integerPart / 1000000000);
  integerPart %= 1000000000;
  const millions = Math.floor(integerPart / 1000000);
  integerPart %= 1000000;
  const thousands = Math.floor(integerPart / 1000);
  const remainder = integerPart % 1000;

  if (billions > 0) {
    if (billions === 1) result += 'مليار';
    else if (billions === 2) result += 'ملياران';
    else if (billions >= 3 && billions <= 10) result += convertGroup(billions) + ' مليارات';
    else result += convertGroup(billions) + ' مليار';
  }

  if (millions > 0) {
    if (result !== '') result += ' و';
    if (millions === 1) result += 'مليون';
    else if (millions === 2) result += 'مليونان';
    else if (millions >= 3 && millions <= 10) result += convertGroup(millions) + ' ملايين';
    else result += convertGroup(millions) + ' مليون';
  }

  if (thousands > 0) {
    if (result !== '') result += ' و';
    if (thousands === 1) result += 'ألف';
    else if (thousands === 2) result += 'ألفان';
    else if (thousands >= 3 && thousands <= 10) result += convertGroup(thousands) + ' آلاف';
    else result += convertGroup(thousands) + ' ألف';
  }

  if (remainder > 0) {
    if (result !== '') result += ' و';
    result += convertGroup(remainder);
  }

  let finalStr = '';
  if (result !== '') {
    if (num === 1) finalStr = `${prefix ? prefix + ' ' : ''}ريال سعودي واحد`;
    else if (num === 2) finalStr = `${prefix ? prefix + ' ' : ''}ريالان سعوديان`;
    else if (num >= 3 && num <= 10) finalStr = `${prefix ? prefix + ' ' : ''}${result} ريالات سعودية`;
    else finalStr = `${prefix ? prefix + ' ' : ''}${result} ${currency}`;
  }

  if (decimalPart > 0) {
    const decText = convertGroup(decimalPart);
    const subText =
      decimalPart === 1
        ? 'هللة واحدة'
        : decimalPart === 2
        ? 'هللتان'
        : decimalPart <= 10
        ? `${decText} هللات`
        : `${decText} ${subCurrency}`;
    if (finalStr !== '') {
      finalStr += ` و${subText}`;
    } else {
      finalStr = `${prefix ? prefix + ' ' : ''}${subText}`;
    }
  }

  if (finalStr !== '' && suffix) {
    finalStr += ` ${suffix}`;
  }

  return finalStr.trim();
}
