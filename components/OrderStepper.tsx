import { CheckCircle } from 'lucide-react';

interface OrderStepperProps {
  status: string;
  onStepClick?: (stepIndex: number) => void;
  reason?: string | null;
}

/** عناوين الخطوات الظاهرة في تتبع الطلب — مصدر واحد للـ UI وللبحث في الطلبات الحالية */
export const ORDER_STEPPER_VISUAL_STEP_LABELS = [
  'الربط مع إدارة المكاتب',
  'المكتب الخارجي',
  'موافقة المكتب الخارجي',
  'الفحص الطبي',
  'موافقة وزارة العمل الأجنبية',
  'دفع الوكالة',
  'موافقة السفارة',
  'إصدار التأشيرة',
  'تصريح السفر',
  'الوجهات',
  'الاستلام',
] as const;

/**
 * لكل خطوة بصريّة: قيم bookingstatus التي تندرج تحتها في البحث
 * (متّسقة مع أقسام track_order وليس مع نصوص «في انتظار …» في قاعدة البيانات)
 */
export const ORDER_STEPPER_VISUAL_STEP_BOOKING_STATUSES: Record<
  number,
  readonly string[]
> = {
  0: ['pending_office_link', 'office_link_approved', 'pending'],
  1: ['pending_external_office'],
  2: ['external_office_approved'],
  3: ['pending_medical_check', 'medical_check_passed'],
  4: ['pending_foreign_labor', 'foreign_labor_approved'],
  5: ['pending_agency_payment', 'agency_paid'],
  6: ['pending_embassy', 'embassy_approved'],
  7: ['pending_visa', 'visa_issued'],
  8: ['pending_travel_permit', 'travel_permit_issued'],
  9: ['pending_receipt'],
  10: ['received'],
};

const stepIcon = <CheckCircle className="w-5 h-5" />;
const steps = ORDER_STEPPER_VISUAL_STEP_LABELS.map((label) => ({
  label,
  icon: stepIcon,
}));

/** خريطة bookingStatus → رقم الخطوة النشطة (يجب أن تبقى متطابقة مع منطق الـ stepper) */
export const ORDER_STEPPER_STATUS_STEP_MAP: Record<string, number> = {
  // الخطوة 0: الربط مع إدارة المكاتب (البداية)
  pending_external_office: 0,
  // الخطوة 2: موافقة المكتب الخارجي (الخطوة 1 معلوماتية)
  external_office_approved: 2,
  // الخطوة 3: الفحص الطبي
  medical_check_passed: 3,
  pending_medical_check: 3,
  // الخطوة 4: موافقة وزارة العمل الأجنبية
  foreign_labor_approved: 4,
  pending_foreign_labor: 4,
  // الخطوة 5: دفع الوكالة
  agency_paid: 5,
  pending_agency_payment: 5,
  // الخطوة 6: موافقة السفارة
  embassy_approved: 6,
  pending_embassy: 6,
  // الخطوة 7: إصدار التأشيرة
  visa_issued: 7,
  pending_visa: 7,
  // الخطوة 8: تصريح السفر
  travel_permit_issued: 8,
  pending_travel_permit: 8,
  // الخطوة 9: الوجهات — الخطوة 10: الاستلام
  received: 10,
  pending_receipt: 9,
};

/** ترتيب عرض حالات البحث (نفس مفاتيح ORDER_STEPPER_STATUS_STEP_MAP + ملغي) */
export const ORDER_STEPPER_BOOKING_STATUS_ORDER = [
  'pending_external_office',
  'external_office_approved',
  'pending_medical_check',
  'medical_check_passed',
  'pending_foreign_labor',
  'foreign_labor_approved',
  'pending_agency_payment',
  'agency_paid',
  'pending_embassy',
  'embassy_approved',
  'pending_visa',
  'visa_issued',
  'pending_travel_permit',
  'travel_permit_issued',
  'pending_receipt',
  'received',
  'cancelled',
] as const;

export type OrderStepperBookingStatusKey = (typeof ORDER_STEPPER_BOOKING_STATUS_ORDER)[number];

/** عناوين عربية لمفاتيح الحالة (للبحث والقوائم — متوافقة مع صفحة الطلبات) */
export const ORDER_STEPPER_BOOKING_STATUS_LABEL_AR: Record<OrderStepperBookingStatusKey, string> = {
  pending_external_office: 'في انتظار المكتب الخارجي',
  external_office_approved: 'موافقة المكتب الخارجي',
  pending_medical_check: 'في انتظار الفحص الطبي',
  medical_check_passed: 'تم اجتياز الفحص الطبي',
  pending_foreign_labor: 'في انتظار وزارة العمل الأجنبية',
  foreign_labor_approved: 'موافقة وزارة العمل الأجنبية',
  pending_agency_payment: 'في انتظار دفع الوكالة',
  agency_paid: 'تم دفع الوكالة',
  pending_embassy: 'في انتظار السفارة السعودية',
  embassy_approved: 'موافقة السفارة السعودية',
  pending_visa: 'في انتظار إصدار التأشيرة',
  visa_issued: 'تم إصدار التأشيرة',
  pending_travel_permit: 'في انتظار تصريح السفر',
  travel_permit_issued: 'تم إصدار تصريح السفر',
  pending_receipt: 'في انتظار الاستلام',
  received: 'تم الاستلام',
  cancelled: 'ملغي',
};

// دالة لحساب الخطوة النشطة بناءً على bookingStatus
function calculateActiveStep(status: string | null | undefined): number {
  if (!status || status === 'cancelled') {
    return status === 'cancelled' ? -1 : 0;
  }

  return ORDER_STEPPER_STATUS_STEP_MAP[status] ?? 0;
}

export default function OrderStepper({ status, onStepClick, reason }: OrderStepperProps) {
  const activeStep = calculateActiveStep(status);

  if (status === 'cancelled' || status === 'عقد ملغي') {
    return (
      <section className="p-5 mb-4 flex flex-col items-center justify-center pointer-events-none">
        <h2 className="text-4xl font-normal text-center text-gray-400 select-none">تتبع الطلب</h2>

        <div className="relative z-10 inline-flex flex-col items-center justify-center p-6 md:p-8 border-4 border-red-600 rounded-lg shadow-lg transform -rotate-6 -mt-10 bg-white/80 backdrop-blur-[2px] mx-auto max-w-xl pointer-events-auto">
          <div className="absolute inset-0 border-2 border-red-600 rounded-lg m-1 opacity-50 border-dashed pointer-events-none"></div>

          <span className="text-4xl md:text-5xl font-black text-red-600 tracking-wider mb-3 uppercase drop-shadow-sm" style={{ textShadow: '2px 2px 0px rgba(220, 38, 38, 0.3)' }}>
            الطلـــب ملغـــي
          </span>

          {reason && (
            <div className="mt-2 p-3 bg-red-50/90 rounded border border-red-200 w-full text-center relative z-10 shadow-inner">
              <span className="block text-xs md:text-sm text-red-800 font-bold mb-1">سبب الإلغاء:</span>
              <p className="text-red-700 font-bold text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {reason}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="p-5 mb-6">
      <h2 className="text-3xl font-normal text-center mb-10">تتبع الطلب</h2>
      <div className="flex no-wrap justify-center gap-5">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div
              className="flex flex-col items-center w-24 text-center cursor-pointer"
              onClick={() => onStepClick?.(index)}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${index < activeStep
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : index === activeStep
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-teal-800 text-teal-800'
                  } text-sm hover:scale-110 transition-transform`}
              >
                {step.icon ? step.icon : index + 1}
              </div>
              <p className="text-xs mt-2 text-gray-900 hover:text-teal-800 transition-colors">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 my-3.5 mx-2.5 ${index < activeStep ? 'bg-teal-800' : 'bg-gray-500'
                  }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}