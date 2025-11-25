import CollapsibleSection from 'components/CollapsibleSection';
import { useEffect, useState, useRef } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';
import React from 'react';

interface ClientInfo {
  id: string;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

interface VisaData {
  id: number;
  visaNumber: string;
  gender: string;
  profession: string;
  visaFile: string;
  nationality: string;
  createdAt: string;
}

interface OrderData {
  id: number;
  ClientName: string;
  PhoneNumber: string;
  bookingstatus: string;
  createdAt: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

const VisaModal = React.memo(
  ({
    isHidden,
    setIsHidden,
    visaInfo,
    setVisaInfo,
    fetchVisas,
    setNotification,
    clientId,
    isEditMode = false,
    visaId,
  }: {
    isHidden: boolean;
    setIsHidden: (isHidden: boolean) => void;
    visaInfo: VisaData;
    setVisaInfo: (visaInfo: VisaData) => void;
    fetchVisas: () => void;
    setNotification: (notification: Notification | null) => void;
    clientId: string;
    isEditMode?: boolean;
    visaId?: number;
  }) => {
    const visaNumberRef = useRef<HTMLInputElement>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
      if (!isHidden && visaNumberRef.current) {
        visaNumberRef.current.focus();
      }
    }, [isHidden]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setVisaInfo({ ...visaInfo, [e.target.name]: e.target.value });
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const validateForm = () => {
      const newErrors: { [key: string]: string } = {};

      if (!visaInfo.visaNumber) {
        newErrors.visaNumber = 'رقم التأشيرة مطلوب';
      } else if (!/^\d+$/.test(visaInfo.visaNumber)) {
        newErrors.visaNumber = 'رقم التأشيرة يجب أن يحتوي على أرقام فقط';
      }

      if (!visaInfo.gender) {
        newErrors.gender = 'الجنس مطلوب';
      }

      if (!visaInfo.nationality) {
        newErrors.nationality = 'الجنسية مطلوبة';
      }

      if (visaInfo.profession && !/^[\u0600-\u06FFa-zA-Z\s]+$/.test(visaInfo.profession)) {
        newErrors.profession = 'المهنة يجب أن تحتوي على أحرف فقط';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

      
    const saveVisaData = async () => {
      if (!validateForm()) {
        setNotification({ message: 'يرجى تصحيح الأخطاء في النموذج', type: 'error' });
        return;
      }

      try {
        const response = await fetch(`/api/visadata${isEditMode ? `` : ''}`, {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visaInfo,
            clientID: clientId,
          }),
        });

        if (response.ok) {
          setNotification({
            message: isEditMode ? 'تم تحديث التأشيرة بنجاح' : 'تم إضافة التأشيرة بنجاح',
            type: 'success',
          });
          setIsHidden(true);
          fetchVisas();
          setVisaInfo({
            id: 0,
            visaNumber: '',
            gender: '',
            profession: '',
            visaFile: '',
            nationality: '',
            createdAt: '',
          });
          setErrors({});
        } else {
          throw new Error(isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة');
        }
      } catch (error) {
        console.error(error);
        setNotification({
          message: isEditMode ? 'فشل في تحديث التأشيرة' : 'فشل في إضافة التأشيرة',
          type: 'error',
        });
      }
    };

    return (
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300 ${
          isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
          <h2 className="text-xl font-semibold text-teal-800 mb-4 text-center">
            {isEditMode ? 'تعديل تأشيرة' : 'إضافة تأشيرة'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                رقم التأشيرة <span className="text-red-500">*</span>
              </label>
              <input
                ref={visaNumberRef}
                type="text"
                name="visaNumber"
                value={visaInfo.visaNumber}
                placeholder="أدخل رقم التأشيرة"
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.visaNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.visaNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.visaNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنس <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={visaInfo.gender}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المهنة</label>
              <input
                type="text"
                name="profession"
                value={visaInfo.profession}
                placeholder="أدخل المهنة"
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.profession ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.profession && (
                <p className="text-red-500 text-sm mt-1">{errors.profession}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنسية <span className="text-red-500">*</span>
              </label>
              <select
                name="nationality"
                value={visaInfo.nationality}
                onChange={handleInputChange}
                className={`w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.nationality ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">اختر الجنسية</option>
                <option value="philippines">فلبين</option>
                <option value="indonesia">إندونيسيا</option>
                <option value="kenya">كينيا</option>
                <option value="india">الهند</option>
                <option value="bangladesh">بنغلاديش</option>
                <option value="other">أخرى</option>
              </select>
              {errors.nationality && (
                <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الملف</label>
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const addFile = await fetch(`/api/upload-presigned-url/visaFile`, {
                      method: 'GET',
                    });
                    const { url, filePath } = await addFile.json();
                    const uploadRes = await fetch(url, {
                      method: 'PUT',
                      body: file,
                      headers: {
                        'Content-Type': file.type,
                        'x-amz-acl': 'public-read',
                      },
                    });

                    if (!uploadRes.ok) throw new Error('فشل في رفع الملف');
                    setVisaInfo({ ...visaInfo, visaFile: filePath });
                    setNotification({ message: 'تم رفع الملف بنجاح', type: 'success' });
                  } catch (error) {
                    console.error(error);
                    setNotification({ message: 'فشل في رفع الملف', type: 'error' });
                  }
                }}
                className="w-full border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsHidden(true)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
              >
                إغلاق
              </button>
              <button
                onClick={saveVisaData}
                className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition"
              >
                {isEditMode ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default function Home() {
  const [isHidden, setIsHidden] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    id: '',
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
  });
  const [visaInfo, setVisaInfo] = useState<VisaData>({
    id: 0,
    visaNumber: '',
    gender: '',
    profession: '',
    visaFile: '',
    nationality: '',
    createdAt: '',
  });
  const [visas, setVisas] = useState<VisaData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVisaId, setEditingVisaId] = useState<number | null>(null);

  const router = useRouter();

  const fetchClientInfo = async () => {
    if (!router.query.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clientinfo?id=${router.query.id}`);
      const data = await response.json();
      setClientInfo(data);
      setOrders(data.orders);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب بيانات العميل', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVisas = async () => {
    if (!router.query.id) return;
    try {
      const response = await fetch(`/api/visadata?clientID=${router.query.id}`);
      const data = await response.json();
      setVisas(data.data);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب بيانات التأشيرات', type: 'error' });
    }
  };

  const handleEditVisa = (visa: VisaData) => {
    setVisaInfo(visa);
    setEditingVisaId(visa.id);
    setIsHidden(false);
  };

  useEffect(() => {
    fetchClientInfo();
    fetchVisas();
  }, [router.query.id]);

  const updateClientInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clientinfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientInfo),
      });
      if (response.ok) {
        setNotification({ message: 'تم تحديث بيانات العميل بنجاح', type: 'success' });
        fetchClientInfo();
      } else {
        throw new Error('فشل في تحديث البيانات');
      }
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في تحديث بيانات العميل', type: 'error' });
    }
  };

  function NotificationModal({
    message,
    type,
    onClose,
  }: {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
  }) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center transition-opacity duration-300">
        <div
          className={`rounded-lg p-6 w-full max-w-sm shadow-xl ${
            type === 'success' ? 'bg-teal-100' : 'bg-red-100'
          }`}
        >
          <p
            className={`text-center font-semibold ${
              type === 'success' ? 'text-teal-800' : 'text-red-800'
            }`}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className={`mt-4 w-full py-2 rounded-md text-white ${
              type === 'success' ? 'bg-teal-800 hover:bg-teal-900' : 'bg-red-800 hover:bg-red-900'
            } transition`}
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }


    // دالة ترجمة حالة الطلب من الإنجليزية إلى العربية
  const translateBookingStatus = (status: string) => {
    const statusTranslations: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'external_office_approved': 'موافقة المكتب الخارجي',
      'pending_external_office': 'في انتظار المكتب الخارجي',
      'medical_check_passed': 'تم اجتياز الفحص الطبي',
      'pending_medical_check': 'في انتظار الفحص الطبي',
      'foreign_labor_approved': 'موافقة وزارة العمل الأجنبية',
      'pending_foreign_labor': 'في انتظار وزارة العمل الأجنبية',
      'agency_paid': 'تم دفع الوكالة',
      'pending_agency_payment': 'في انتظار دفع الوكالة',
      'embassy_approved': 'موافقة السفارة السعودية',
      'pending_embassy': 'في انتظار السفارة السعودية',
      'visa_issued': 'تم إصدار التأشيرة',
      'pending_visa': 'في انتظار إصدار التأشيرة',
      'travel_permit_issued': 'تم إصدار تصريح السفر',
      'pending_travel_permit': 'في انتظار تصريح السفر',
      'received': 'تم الاستلام',
      'pending_receipt': 'في انتظار الاستلام',
      'cancelled': 'ملغي',
      'rejected': 'مرفوض',
      'delivered': 'تم التسليم',
      'new_order': 'طلب جديد',
      'new_orders': 'طلبات جديدة'
    };
    
    return statusTranslations[status] || status;
  };




const arabicRegionMap: { [key: string]: string } = {
    'Ar Riyāḍ': 'الرياض',
    'Makkah al Mukarramah': 'مكة المكرمة',
    'Al Madīnah al Munawwarah': 'المدينة المنورة',
    'Ash Sharqīyah': 'المنطقة الشرقية',
    'Asīr': 'عسير',
    'Tabūk': 'تبوك',
    'Al Ḩudūd ash Shamālīyah': 'الحدود الشمالية',
    'Jazan': 'جازان',
    'Najrān': 'نجران',
    'Al Bāḩah': 'الباحة',
    'Al Jawf': 'الجوف',
    'Al Qaşīm': 'القصيم',
    'Ḩa\'il': 'حائل',
  };

  const translateCity = (city: string) => {
    return arabicRegionMap[city as keyof typeof arabicRegionMap];
  }


  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-800"></div>
          </div>
        )}
        <VisaModal
          isHidden={isHidden}
          setIsHidden={setIsHidden}
          visaInfo={visaInfo}
          setVisaInfo={setVisaInfo}
          fetchVisas={fetchVisas}
          setNotification={setNotification}
          clientId={router.query.id as string}
          isEditMode={editingVisaId !== null}
          visaId={editingVisaId || undefined}
        />
        {notification && (
          <NotificationModal
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-7xl mx-auto">
          <p className="text-right text-xl text-gray-600 mb-8">
            رقم العميل: <span className="text-teal-800 font-bold">{clientInfo.id}</span>
          </p>

          <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold text-teal-800 text-center mb-6">
              المعلومات الشخصية
            </h2>
            <form onSubmit={updateClientInfo}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">اسم العميل</label>
                  <input
                    type="text"
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.fullname}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, fullname: e.target.value })
                    }
                    readOnly
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.phonenumber}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, phonenumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">رقم الهوية</label>
                  <input
                    type="number"
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.nationalId}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, nationalId: e.target.value })
                    }
                    // readOnly
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">المدينة</label>
                  <select
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.city}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, city: e.target.value })
                    }
                    required
                  >
                    <option value="Ar Riyāḍ">الرياض</option>
                    <option value="Makkah al Mukarramah">مكة المكرمة</option>
                    <option value="Al Madīnah al Munawwarah">المدينة المنورة</option>
                    <option value="Ash Sharqīyah">المنطقة الشرقية</option>
                    <option value="Asīr">عسير</option>
                    <option value="Tabūk">تبوك</option>
                    <option value="Al Ḩudūd ash Shamālīyah">الحدود الشمالية</option>
                    <option value="Jazan">جازان</option>
                    <option value="Najrān">نجران</option>
                    <option value="Al Bāḩah">الباحة</option>
                    <option value="Al Jawf">الجوف</option>
                    <option value="Al Qaşīm">القصيم</option>
                    <option value="Ḩa'il">حائل</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mt-6 bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition mx-auto block"
              >
                حفظ التعديلات
              </button>
            </form>
          </div>

          <CollapsibleSection title="بيانات التأشيرة">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => {
                  setVisaInfo({
                    id: 0,
                    visaNumber: '',
                    gender: '',
                    profession: '',
                    visaFile: '',
                    nationality: '',
                    createdAt: '',
                  });
                  setEditingVisaId(null);
                  setIsHidden(false);
                }}
              >
                إضافة تأشيرة
              </button>
              {visas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-center">
                        <th className="p-3 border text-center">رقم التأشيرة</th>
                        <th className="p-3 border text-center">الجنس</th>
                        <th className="p-3 border text-center">المهنة</th>
                        <th className="p-3 border text-center">الجنسية</th>
                        <th className="p-3 border text-center">تاريخ الإنشاء</th>
                        <th className="p-3 border text-center">الملف</th>
                        <th className="p-3 border text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visas.map((visa) => (
                        <tr key={visa.id} className="hover:bg-gray-50 text-center">
                          <td className="p-3 border text-center">{visa.visaNumber}</td>
                          <td className="p-3 border text-center">{visa.gender}</td>
                          <td className="p-3 border text-center">{visa.profession}</td>
                          <td className="p-3 border text-center">{visa.nationality}</td>
                          <td className="p-3 border text-center">
                            {new Date(visa.createdAt).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 border">
                            {visa.visaFile ? (
                              <a
                                href={visa.visaFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline"
                              >
                                عرض الملف
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 border">
                            <button
                              onClick={() => handleEditVisa(visa)}
                              className="text-teal-600 hover:underline"
                            >
                              تعديل
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد تأشيرات بعد</p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="الطلبات">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() =>
                  router.push(
                    `/admin/order-form?type=add-available&clientId=${router.query.id}&clientName=${clientInfo.fullname}&clientPhone=${clientInfo.phonenumber}&clientCity=${clientInfo.city}`
                  )
                }
              >
                إضافة طلب
              </button>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-800 text-white text-center">
                        <th className="p-3 border text-center">رقم الطلب</th>
                        <th className="p-3 border text-center">اسم العميل</th>
                        <th className="p-3 border text-center">رقم الهاتف</th>
                        <th className="p-3 border text-center">حالة الحجز</th>
                        <th className="p-3 border text-center">تاريخ الإنشاء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 text-center">
                          <td className="p-3 border text-center">{order.id}</td>
                          <td className="p-3 border text-center">{order.ClientName}</td>
                          <td className="p-3 border text-center">{order.PhoneNumber}</td>
                          <td className="p-3 border text-center">{translateBookingStatus(order.bookingstatus)}</td>
                          <td className="p-3 border text-center">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">لا توجد طلبات بعد</p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="البيانات المالية">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => router.push(`/admin/client-accounts?clientId=${router.query.id}`)}
              >
                إضافة بيانات مالية
              </button>
              <p className="text-center text-gray-600">
                سيتم عرض البيانات المالية هنا (كشف حساب العميل)
              </p>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </Layout>
  );
}