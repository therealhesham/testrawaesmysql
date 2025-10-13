import CollapsibleSection from 'components/CollapsibleSection';
import { useEffect, useState } from 'react';
import Layout from 'example/containers/Layout';
import { useRouter } from 'next/router';

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

export default function Home() {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    id: '',
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
  });
  const [visaInfo, setVisaInfo] = useState({
    visaNumber: '',
    gender: '',
    profession: '',
    visaFile: '',
    nationality: '',
  });
  const [visas, setVisas] = useState<VisaData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClientInfo = async () => {
    if (!router.query.id) return;
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clientinfo?id=${router.query.id}`);
      const data = await response.json();
      setClientInfo(data);
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
      setVisas(data);
    } catch (error) {
      console.error(error);
      setNotification({ message: 'فشل في جلب بيانات التأشيرات', type: 'error' });
    }
  };

  // const fetchOrders = async () => {
  //   if (!router.query.id) return;
  //   try {
  //     const response = await fetch(`/api/ordersbyclientid?clientID=${router.query.id}`);
  //     const data = await response.json();
  //     setOrders(data);
  //   } catch (error) {
  //     console.error(error);
  //     setNotification({ message: 'فشل في جلب بيانات الطلبات', type: 'error' });
  //   }
  // };

  useEffect(() => {
    fetchClientInfo();
    fetchVisas();
    // fetchOrders();
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

  function VisaModal({
    isHidden,
    setIsHidden,
  }: {
    isHidden: boolean;
    setIsHidden: (isHidden: boolean) => void;
  }) {
    const addVisaData = async () => {
      if (!visaInfo.visaNumber || !visaInfo.gender || !visaInfo.nationality) {
        setNotification({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
        return;
      }

      try {
        const response = await fetch(`/api/visadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...visaInfo,
            clientID: router.query.id,
          }),
        });
        if (response.ok) {
          setNotification({ message: 'تم إضافة التأشيرة بنجاح', type: 'success' });
          setIsHidden(true);
          fetchVisas();
          setVisaInfo({
            visaNumber: '',
            gender: '',
            profession: '',
            visaFile: '',
            nationality: '',
          });
        } else {
          throw new Error('فشل في إضافة التأشيرة');
        }
      } catch (error) {
        console.error(error);
        setNotification({ message: 'فشل في إضافة التأشيرة', type: 'error' });
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
            إضافة تأشيرة
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                رقم التأشيرة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={visaInfo.visaNumber}
                placeholder="أدخل رقم التأشيرة"
                onChange={(e) =>
                  setVisaInfo({ ...visaInfo, visaNumber: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنس <span className="text-red-500">*</span>
              </label>
              <select
                value={visaInfo.gender}
                onChange={(e) =>
                  setVisaInfo({ ...visaInfo, gender: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">اختر الجنس</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">المهنة</label>
              <input
                type="text"
                value={visaInfo.profession}
                placeholder="أدخل المهنة"
                onChange={(e) =>
                  setVisaInfo({ ...visaInfo, profession: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                الجنسية <span className="text-red-500">*</span>
              </label>
              <select
                value={visaInfo.nationality}
                onChange={(e) =>
                  setVisaInfo({ ...visaInfo, nationality: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الملف</label>
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const addFile = await fetch(
                      `/api/upload-presigned-url/visaFile`,
                      { method: 'GET' }
                    );
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
                className="w-full p-2 border border-gray-300 rounded-md"
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
                onClick={addVisaData}
                className="px-4 py-2 bg-teal-800 text-white rounded-md hover:bg-teal-900 transition"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-800"></div>
          </div>
        )}
        <VisaModal isHidden={isHidden} setIsHidden={setIsHidden} />
        {notification && (
          <NotificationModal
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="max-w-7xl mx-auto">
          {/* <h1 className="text-3xl md:text-4xl font-bold text-teal-800 text-center mb-8">
            وصل للاستقدام
          </h1> */}
          <p className="text-right text-xl text-gray-600 mb-8">
            رقم العميل: {clientInfo.id}
          </p>

          {/* Personal Information Form */}
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
                    type="text"
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.nationalId}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, nationalId: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600 mb-1">المدينة</label>
                  <input
                    type="text"
                    className="p-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={clientInfo.city}
                    onChange={(e) =>
                      setClientInfo({ ...clientInfo, city: e.target.value })
                    }
                  />
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

          {/* Visa Data Section */}
          <CollapsibleSection title="بيانات التأشيرة">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => setIsHidden(false)}
              >
                إضافة تأشيرة
              </button>
              {visas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-100">
                        <th className="p-3 border">رقم التأشيرة</th>
                        <th className="p-3 border">الجنس</th>
                        <th className="p-3 border">المهنة</th>
                        <th className="p-3 border">الجنسية</th>
                        <th className="p-3 border">تاريخ الإنشاء</th>
                        <th className="p-3 border">الملف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visas.map((visa) => (
                        <tr key={visa.id} className="hover:bg-gray-50">
                          <td className="p-3 border">{visa.visaNumber}</td>
                          <td className="p-3 border">{visa.gender}</td>
                          <td className="p-3 border">{visa.profession}</td>
                          <td className="p-3 border">{visa.nationality}</td>
                          <td className="p-3 border">
                            {new Date(visa.createdAt).toLocaleDateString('ar-SA')}
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

          {/* Orders Section */}
          <CollapsibleSection title="الطلبات">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => router.push(`/admin/order-form?type=add-available&clientId=${router.query.id}&clientName=${clientInfo.fullname}&clientPhone=${clientInfo.phonenumber}&clientCity=${clientInfo.city}`)}
              >
                إضافة طلب
              </button>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-teal-100">
                        <th className="p-3 border">رقم الطلب</th>
                        <th className="p-3 border">اسم العميل</th>
                        <th className="p-3 border">رقم الهاتف</th>
                        <th className="p-3 border">حالة الحجز</th>
                        <th className="p-3 border">تاريخ الإنشاء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-3 border">{order.id}</td>
                          <td className="p-3 border">{order.ClientName}</td>
                          <td className="p-3 border">{order.PhoneNumber}</td>
                          <td className="p-3 border">{order.bookingstatus}</td>
                          <td className="p-3 border">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
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

          {/* Financial Data Section */}
          <CollapsibleSection title="البيانات المالية">
            <div className="flex flex-col gap-4">
              <button
                className="mx-auto bg-teal-800 text-white py-2 px-8 rounded-md hover:bg-teal-900 transition"
                onClick={() => router.push(`/financials/new?clientId=${router.query.id}`)}
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