import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
import AddTransactionForm from 'pages/admin/AddTransactionForm';
import ServiceTransferTable from 'components/ServiceTransferTable';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface Permissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function Home({ permissions = { canView: true, canCreate: true, canEdit: true, canDelete: true } }: { permissions?: Permissions }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  const handleEditTransaction = (id: number) => {
    if (!permissions.canEdit) return;
    setTransactionId(id);
    setShowForm(true);
  };

  // شاشة تنبيه واضحة في حال عدم توفر صلاحية العرض
  if (!permissions.canView) {
    return (
      <Layout>
        <Head>
          <title>غير مصرح بالوصول | معاملات نقل الكفالة</title>
        </Head>
        <div className={`min-h-[75vh] flex items-center justify-center p-4 ${Style["tajawal-medium"]}`} dir="rtl">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                غير مصرح لك بالوصول
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                عذراً، حسابك لا يمتلك صلاحية <span className="font-bold text-red-600">«عرض معاملات نقل الكفالة»</span>. يرجى مراجعة إدارة النظام لتفعيل الصلاحية المطلوبة من صفحة إدارة الصلاحيات.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/home')}
                className="w-full py-3 px-6 bg-teal-900 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>العودة إلى الصفحة الرئيسية</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (showForm) {
    return (
      <AddTransactionForm
        transactionId={transactionId}
        permissions={permissions}
        onBack={() => {
          setShowForm(false);
          setTransactionId(null);
        }}
      />
    );
  }

  return (
    <Layout>
      <Head>
        <title>معاملات نقل الخدمات - نقل الكفالة</title>
      </Head>
      <div className={`min-h-screen bg-gray-50/50 ${Style["tajawal-medium"]}`} dir="rtl">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-5">
          <ServiceTransferTable
            permissions={permissions}
            onAddTransaction={() => {
              if (permissions.canCreate) {
                setTransactionId(null);
                setShowForm(true);
              }
            }}
            onEditTransaction={handleEditTransaction}
          />
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: any) {
  const { req } = context;
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie: string) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }

  try {
    const token = jwtDecode(cookies.authToken) as any;
    const findUser = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      include: { role: true },
    });

    if (!findUser) {
      return { redirect: { destination: '/admin/login', permanent: false } };
    }

    let rolePermissions = findUser?.role?.permissions as any;
    if (typeof rolePermissions === 'string') {
      try {
        rolePermissions = JSON.parse(rolePermissions);
      } catch {
        rolePermissions = {};
      }
    }

    const canView = rolePermissions?.['معاملات نقل الكفالة']?.['عرض'] === true;
    const canCreate = rolePermissions?.['معاملات نقل الكفالة']?.['إنشاء'] === true || rolePermissions?.['معاملات نقل الكفالة']?.['انشاء'] === true;
    const canEdit = rolePermissions?.['معاملات نقل الكفالة']?.['تعديل'] === true;
    const canDelete = rolePermissions?.['معاملات نقل الكفالة']?.['حذف'] === true;

    const permissions: Permissions = {
      canView,
      canCreate,
      canEdit,
      canDelete,
    };

    return { props: { permissions } };
  } catch (err) {
    return { redirect: { destination: '/admin/login', permanent: false } };
  }
}