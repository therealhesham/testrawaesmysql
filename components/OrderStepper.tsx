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
  { label: 'تم التعاقد مع إدارة المكاتب', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الربط مع المكتب الخارجي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة المكتب الخارجي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة وزارة العمل الأجنبية', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الفحص الطبي', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'دفع الوكالة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'موافقة السفارة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'إصدار التأشيرة', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'تصريح السفر', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الوجهات', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'الاستلام', icon: <CheckCircle className="w-5 h-5" /> },
];

const statusToStepMap: { [key: string]: number } = {
  pending_external_office: 0,
  external_office_approved: 1,
  medical_check_passed: 2,
  pending_medical_check: 2,
  foreign_labor_approved: 3,
  pending_foreign_labor: 3,
  agency_paid: 4,
  pending_agency_payment: 4,
  embassy_approved: 5,
  pending_embassy: 5,
  visa_issued: 6,
  pending_visa: 6,
  travel_permit_issued: 7,
  pending_travel_permit: 7,
  received: 8,
  pending_receipt: 8,
  cancelled: -1,
};

export default function OrderStepper({ status, onStepClick }: OrderStepperProps) {
  const activeStep = statusToStepMap[status] ?? 0;

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