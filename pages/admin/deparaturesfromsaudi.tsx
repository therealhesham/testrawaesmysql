import Head from 'next/head';
import { useState } from 'react';
import Style from "styles/Home.module.css"
import DepartureList from '../../components/DepartureList';
import DepartureModal from 'components/DepartureExternalModal';
import Layout from 'example/containers/Layout';
import DepartureExternalList from 'components/DeparatureExternalList';
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
        <title>المغادرة الخارجية</title>
        <meta name="description" content=" إدارة المغادرة الخارجية" />
      </Head>
      <div className={`max-w-7xl mx-auto bg-gray-100 min-h-screen ${Style["tajawal-regular"]}`}>
        <main className="p-6 md:p-10">
          <DepartureExternalList onOpenModal={openModal} />
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