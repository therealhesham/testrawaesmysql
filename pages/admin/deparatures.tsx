import Head from 'next/head';
import { useState, useEffect } from 'react';
import Style from "styles/Home.module.css";
import DepartureList from '../../components/DepartureList';
import DepartureModal from 'components/DeparatureModal';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
import { useRouter } from 'next/router';

// Unauthorized Modal Component
const UnauthorizedModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">غير مصرح</h2>
        <p className="mb-4">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
        <button
          onClick={onClose}
          className="bg-teal-900 text-white px-4 py-2 rounded hover:bg-teal-600"
        >
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    </div>
  );
};

export default function Home({ isUnauthorized = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showUnauthorizedModal, setShowUnauthorizedModal] = useState(isUnauthorized);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
        <title>المغادرة الداخلية</title>
        <meta name="description" content="إدارة المغادرة الداخلية" />
      </Head>
      <div className={`max-w-7xl mx-auto  min-h-screen ${Style["tajawal-regular"]}`}>
        <main className="p-6 md:p-10">
          {!isUnauthorized && <DepartureList onOpenModal={openModal} refreshTrigger={refreshTrigger} />}
          {isModalOpen && (
            <DepartureModal
              currentStep={currentStep}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onClose={closeModal}
              onSuccess={handleDepartureSuccess}
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

    if (
      !findUser 
      // !findUser.role?.permissions?.["إدارة الوصول والمغادرة"]?.["عرض"]
    ) {
      return {
        props: { isUnauthorized: true }, // Show modal for unauthorized access
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      props: { isUnauthorized: true }, // Handle errors by showing unauthorized modal
    };
  }
}