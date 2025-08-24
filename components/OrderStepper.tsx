import { OfficeBuildingIcon } from '@heroicons/react/outline';
import { Briefcase, Link, CheckCircle, DollarSign, Flag,Plane, MapPin, Package } from 'lucide-react';
import { FaPassport, FaStethoscope } from 'react-icons/fa';
// import { OfficeBuildingIcon } from '@heroicons/react/24/outline';
// FaPassport
// FaStethoscope
// OfficeBuildingIcon
export default function OrderStepper() {
  const steps = [
    { label: 'تم التعاقد مع ادارة المكاتب', status: 'completed', icon: <OfficeBuildingIcon className="w-5 h-5" /> }, // Heroicon for office management
    { label: 'الربط مع المكتب الخارجي', status: 'completed', icon: <Link className="w-5 h-5" /> }, // Lucide icon for connection
    { label: 'موافقة المكتب الخارجي', status: 'completed', icon: <CheckCircle className="w-5 h-5" /> }, // Lucide icon for approval
    { label: 'موافقة وزراة العمل الاجنبية', status: 'completed', icon: <Briefcase className="w-5 h-5" /> }, // Lucide icon for ministry/work
    { label: 'الفحص الطبي', status: 'completed', icon: <FaStethoscope className="w-5 h-5" /> }, // Lucide icon for medical check
    { label: 'دفع الوكالة', status: 'active', icon: <DollarSign className="w-5 h-5" /> }, // Lucide icon for payment
    { label: 'موافقة السفارة', status: '', icon: <Flag className="w-5 h-5" /> }, // Lucide icon for embassy
    { label: 'اصدار التاشيرة', status: '', icon: <FaPassport className="w-5 h-5" /> }, // Lucide icon for visa
    { label: 'تصريح السفر', status: '', icon: <Plane className="w-5 h-5" /> }, // Lucide icon for travel permit
    { label: 'الوجهات', status: '', icon: <MapPin className="w-5 h-5" /> }, // Lucide icon for destinations
    { label: 'الاستلام', status: '', icon: <Package className="w-5 h-5" /> }, // Lucide icon for receipt/delivery
  ];

  return (
    <section className="p-5 mb-6">
      <h2 className="text-3xl font-normal text-center mb-10">تتبع الطلب</h2>
      <div className="flex flex-wrap justify-center gap-5">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="flex flex-col items-center w-24 text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  step.status === 'completed' || step.status === 'active'
                    ? 'bg-teal-800 border-teal-800 text-white'
                    : 'border-teal-800 text-teal-800'
                } text-sm`}
              >
                {step.icon ? step.icon : index + 1}
              </div>
              <p className="text-xs mt-2 text-gray-900">{step.label}</p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 my-3.5 mx-2.5 ${
                  step.status === 'completed' ? 'bg-teal-800' : 'bg-gray-500'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}