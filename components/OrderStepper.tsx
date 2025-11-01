import { CheckCircleFilled, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { OfficeBuildingIcon } from '@heroicons/react/outline';
import { CheckCircle2 } from 'lucide-react';
import { Briefcase, Link, CheckCircle, DollarSign, Flag, Plane, MapPin, Package } from 'lucide-react';
import { FaPassport, FaStethoscope } from 'react-icons/fa';

interface OrderStepperProps {
  status: string;
  onStepClick?: (stepIndex: number) => void;
}

const steps = [
  { label: 'الربط مع إدارة المكاتب', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'المكتب الخارجي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة المكتب الخارجي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الفحص الطبي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة وزارة العمل الأجنبية', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'دفع الوكالة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة السفارة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'إصدار التأشيرة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'تصريح السفر', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الوجهات', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الاستلام', icon: <CheckCircle className="w-5 h-5" /> },
];

// دالة لحساب الخطوة النشطة بناءً على bookingStatus
function calculateActiveStep(status: string | null | undefined): number {
  if (!status || status === 'cancelled') {
    return status === 'cancelled' ? -1 : 0;
  }

  // خريطة الحالات إلى الخطوات النشطة
  // الخطوة النشطة هي الخطوة التي يجب أن يكون المستخدم فيها حالياً
  const statusStepMap: { [key: string]: number } = {
    // الخطوة 0: الربط مع إدارة المكاتب (البداية)
    pending_external_office: 0,
    
    // الخطوة 2: موافقة المكتب الخارجي
    // (الخطوة 1 هي "المكتب الخارجي" - خطوة معلوماتية فقط)
    external_office_approved: 2,
    
    // الخطوة 3: الفحص الطبي
    medical_check_passed: 3,
    pending_medical_check: 3, // الخطوة الحالية هي الفحص الطبي
    
    // الخطوة 4: موافقة وزارة العمل الأجنبية
    foreign_labor_approved: 4,
    pending_foreign_labor: 4, // الخطوة الحالية هي موافقة العمل الأجنبية
    
    // الخطوة 5: دفع الوكالة
    agency_paid: 5,
    pending_agency_payment: 5, // الخطوة الحالية هي دفع الوكالة
    
    // الخطوة 6: موافقة السفارة
    embassy_approved: 6,
    pending_embassy: 6, // الخطوة الحالية هي موافقة السفارة
    
    // الخطوة 7: إصدار التأشيرة
    visa_issued: 7,
    pending_visa: 7, // الخطوة الحالية هي إصدار التأشيرة
    
    // الخطوة 8: تصريح السفر
    travel_permit_issued: 8,
    pending_travel_permit: 8, // الخطوة الحالية هي تصريح السفر
    
    // الخطوة 9: الوجهات
    // الخطوة 10: الاستلام
    received: 10,
    pending_receipt: 9, // الخطوة الحالية هي الوجهات (9) قبل الاستلام (10)
  };

  return statusStepMap[status] ?? 0;
}

export default function OrderStepper({ status, onStepClick }: OrderStepperProps) {
  const activeStep = calculateActiveStep(status);

  if (status === 'cancelled') {
    return (
      <section className="p-5 mb-6">
        <h2 className="text-3xl font-normal text-center mb-10">تتبع الطلب</h2>
        <div className="text-red-600 text-center p-4">تم إلغاء الطلب</div>
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
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  index < activeStep
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
                className={`flex-1 h-0.5 my-3.5 mx-2.5 ${
                  index < activeStep ? 'bg-teal-800' : 'bg-gray-500'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}