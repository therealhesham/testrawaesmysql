import Head from 'next/head';
import { useState } from 'react';
import Style from "styles/Home.module.css"
import DepartureList from '../../components/DepartureList';
import DepartureModal from 'components/DeparatureModal';
import Layout from 'example/containers/Layout';
import { jwtDecode } from 'jwt-decode';
import prisma from 'pages/api/globalprisma';
export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentStep(1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToNextStep = () => {
    setCurrentStep(2);
  };

  const goToPreviousStep = () => {
    setCurrentStep(1);
  };

  return (
    
    <Layout>
      <Head>
        <title>المغادرة الداخلية</title>
        <meta name="description" content=" إدارة المغادرة الداخلية" />
      </Head>
      <div className={`max-w-7xl mx-auto bg-gray-100 min-h-screen ${Style["tajawal-regular"]}`}>
        <main className="p-6 md:p-10">
          <DepartureList onOpenModal={openModal} />
          {isModalOpen && (
            <DepartureModal
              currentStep={currentStep}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
              onClose={closeModal}
            />
          )}
        </main>
      </div>
    </Layout>
  );
}



export async function getServerSideProps ({ req }) {
  try {
    console.log("sss")
    // 🔹 Extract cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    // 🔹 Check for authToken
    if (!cookies.authToken) {
      return {
        redirect: { destination: "/admin/login", permanent: false },
      };
    }

    // 🔹 Decode JWT
    const token = jwtDecode(cookies.authToken);

    // 🔹 Fetch user & role with Prisma
    const findUser = await prisma.user.findUnique({
      where: { id: token.id },
      include: { role: true },
    });
console.log(findUser.role?.permissions?.["إدارة الطلبات"])
    if (
      !findUser ||
      !findUser.role?.permissions?.["إدارة الوصول والمغادرة"]?.["عرض"]
    ) {
      return {
        redirect: { destination: "/admin/home", permanent: false }, // or show 403
      };
    }

    return { props: {} };
  } catch (err) {
    console.error("Authorization error:", err);
    return {
      redirect: { destination: "/admin/home", permanent: false },
    };
  }
};