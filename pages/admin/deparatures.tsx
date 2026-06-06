import Head from 'next/head';
import { useState, useEffect } from 'react';
import Style from "styles/Home.module.css";
import DepartureList from '../../components/DepartureList';
import DepartureExternalList from 'components/DeparatureExternalList';
import DepartureModal from 'components/DeparatureModal';
import DepartureExternalModal from 'components/DepartureExternalModal';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';
import prisma from 'lib/prisma';
import { useRouter } from 'next/router';

// Unauthorized Modal Component
const UnauthorizedModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-right" dir="rtl">
        <h2 className="text-xl font-bold mb-4">غير مصرح</h2>
        <p className="mb-4 text-gray-600">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
        <button
          onClick={onClose}
          className="w-full bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
        >
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    </div>
  );
};

// Stats Overview Component
const StatsOverview = ({ internalCount, externalCount }: { internalCount: number; externalCount: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-right" dir="rtl">
      
      {/* إجمالي المغادرات */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">إجمالي المغادرات</p>
          <h3 className="text-3xl font-extrabold text-teal-950 font-mono leading-none">{internalCount + externalCount}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-800 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </div>
      </div>
      
      {/* المغادرات الداخلية */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">المغادرات الداخلية (داخل المملكة)</p>
          <h3 className="text-3xl font-extrabold text-emerald-700 font-mono leading-none">{internalCount}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </div>

      {/* المغادرات الخارجية */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-1 tracking-wide">المغادرات الخارجية (خارج المملكة)</p>
          <h3 className="text-3xl font-extrabold text-amber-600 font-mono leading-none">{externalCount}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
      </div>
      
    </div>
  );
};

export default function DeparturesPage({ internalCount, externalCount, isUnauthorized, canAdd, canEdit, canDelete }: any) {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(isUnauthorized);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [iCount, setICount] = useState(internalCount);
  const [eCount, setECount] = useState(externalCount);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/deparatures/stats');
      if (res.ok) {
        const data = await res.json();
        setICount(data.internalCount || 0);
        setECount(data.externalCount || 0);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger, activeTab]);

  useEffect(() => {
    if (router.query.tab === 'external') {
      setActiveTab('external');
    } else {
      setActiveTab('internal');
    }
  }, [router.query.tab]);

  const handleTabChange = (tab: 'internal' | 'external') => {
    setActiveTab(tab);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab },
    }, undefined, { shallow: true });
  };

  const openModal = () => {
    if (activeTab === 'internal') {
      setIsModalOpen(true);
    } else {
      setIsExternalModalOpen(true);
    }
    setCurrentStep(1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsExternalModalOpen(false);
  };

  const handleDepartureSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const goToNextStep = () => {
    setCurrentStep(2);
  };

  const goToPreviousStep = () => {
    setCurrentStep(1);
  };

  const handleUnauthorizedClose = () => {
    setShowUnauthorizedModal(false);
    router.push('/admin/home'); // Redirect to home after closing the modal
  };

  // Automatically show unauthorized modal if isUnauthorized is true
  useEffect(() => {
    if (isUnauthorized) {
      setShowUnauthorizedModal(true);
    }
  }, [isUnauthorized]);

  return (
    <Layout>
      <Head>
        <title>{activeTab === 'internal' ? 'المغادرة الداخلية' : 'المغادرة الخارجية'}</title>
        <meta name="description" content="إدارة شؤون المغادرات" />
      </Head>
      <div className={`w-full mx-auto min-h-screen ${Style["tajawal-regular"]}`} dir="rtl">
        <main className="p-6 md:p-10">
          
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-6">قائمة المغادرة</h1>

          {/* Stats Overview */}
          {!isUnauthorized && <StatsOverview internalCount={iCount} externalCount={eCount} />}

          {/* Tabs Selector */}
          <div className="flex border-b border-gray-200 mb-8 w-full justify-start items-center gap-4">
            <button
              onClick={() => handleTabChange('internal')}
              className={`pb-3 text-lg font-bold border-b-2 px-4 transition-all duration-200 ${
                activeTab === 'internal'
                  ? 'border-teal-800 text-teal-850'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              المغادرة الداخلية
            </button>
            <button
              onClick={() => handleTabChange('external')}
              className={`pb-3 text-lg font-bold border-b-2 px-4 transition-all duration-200 ${
                activeTab === 'external'
                  ? 'border-teal-800 text-teal-850'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              المغادرة الخارجية
            </button>
          </div>

          {!isUnauthorized && (
            <div>
              {activeTab === 'internal' ? (
                <DepartureList onOpenModal={openModal} refreshTrigger={refreshTrigger} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />
              ) : (
                <DepartureExternalList onOpenModal={openModal} canAdd={canAdd} canEdit={canEdit} canDelete={canDelete} />
              )}
            </div>
          )}

          {/* Internal Departure Modal */}
          {isModalOpen && activeTab === 'internal' && (
            <DepartureModal
              currentStep={currentStep}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onClose={closeModal}
              onSuccess={handleDepartureSuccess}
            />
          )}

          {/* External Departure Modal */}
          {isExternalModalOpen && activeTab === 'external' && (
            <DepartureExternalModal
              currentStep={currentStep}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onClose={closeModal}
            />
          )}

          {showUnauthorizedModal && <UnauthorizedModal onClose={handleUnauthorizedClose} />}
        </main>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req }: { req: any }) {
  try {
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie: string) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        props: { isUnauthorized: true }, // Show modal instead of redirect
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken) as any;

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });

    const permissions = findUser?.role?.permissions as Record<string, any> || {};
    
    if (
      !findUser ||
      permissions["إدارة الوصول و المغادرة"]?.["عرض"] !== true
    ) {
      return {
        props: { isUnauthorized: true }, // Show modal for unauthorized access
      };
    }

    const canAdd = permissions["إدارة الوصول و المغادرة"]?.["إضافة"] === true;
    const canEdit = permissions["إدارة الوصول و المغادرة"]?.["تعديل"] === true;

    const canDelete = permissions["إدارة الوصول و المغادرة"]?.["حذف"] === true;

    // 🔹 Calculate Stats Counts
    const internalCount = await prisma.arrivallist.count({
      where: { internaldeparatureDate: { not: null } },
    });
    const externalCount = await prisma.arrivallist.count({
      where: { externaldeparatureDate: { not: null } },
    });

    console.log("Prisma Counts from getServerSideProps:", { internalCount, externalCount });

    return { 
      props: {
        internalCount: internalCount || 0,
        externalCount: externalCount || 0,
        canAdd,
        canEdit,
        canDelete,
      } 
    };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { isUnauthorized: true }, // Handle errors by showing unauthorized modal
    };
  }
}