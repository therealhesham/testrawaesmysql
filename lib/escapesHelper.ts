import prisma from './prisma';

export interface EscapeWarrantyCalculation {
  daysSinceArrival: number | null;
  isWithinWarranty: boolean;
  visaFeeRequired: boolean;
  visaFeeAmount: number;
}

/**
 * احتساب مدة الهروب من تاريخ الوصول للمملكة (KingdomentryDate)
 * إذا كانت المدة <= 90 يوماً يكون داخل فترة الضمان والعميل مطالب بـ 2000 ريال رسوم تأشيرة
 */
export function calculateEscapeWarranty(
  arrivalDateInput?: Date | string | null,
  escapeDateInput?: Date | string | null
): EscapeWarrantyCalculation {
  if (!arrivalDateInput || !escapeDateInput) {
    return {
      daysSinceArrival: null,
      isWithinWarranty: false,
      visaFeeRequired: false,
      visaFeeAmount: 0,
    };
  }

  const arrival = new Date(arrivalDateInput);
  const escape = new Date(escapeDateInput);

  if (isNaN(arrival.getTime()) || isNaN(escape.getTime())) {
    return {
      daysSinceArrival: null,
      isWithinWarranty: false,
      visaFeeRequired: false,
      visaFeeAmount: 0,
    };
  }

  // حساب الأيام التقويمية
  const startDay = new Date(arrival.getFullYear(), arrival.getMonth(), arrival.getDate()).getTime();
  const escapeDay = new Date(escape.getFullYear(), escape.getMonth(), escape.getDate()).getTime();
  const diffTime = escapeDay - startDay;

  // إذا كان تاريخ الهروب يسبق تاريخ الوصول للمملكة، لا يمكن اعتباره داخل الضمان
  if (diffTime < 0) {
    return {
      daysSinceArrival: null,
      isWithinWarranty: false,
      visaFeeRequired: false,
      visaFeeAmount: 0,
    };
  }

  const daysSinceArrival = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isWithinWarranty = daysSinceArrival <= 90;

  return {
    daysSinceArrival,
    isWithinWarranty,
    visaFeeRequired: false,
    visaFeeAmount: 0,
  };
}
