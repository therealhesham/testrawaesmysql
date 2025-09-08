import RentalForm from 'components/RentalForm';
import RequestsTable from 'components/RequestTable';
import Layout from 'example/containers/Layout';
import Head from 'next/head';
import Style from "styles/Home.module.css"
export default function RequestsInProgress() {
  return (
    <Layout>    <div className={`min-h-screen bg-gray-100 font-tajawal ${Style["tajawal-regular"]}`} dir="rtl">
      <main className="max-w-7xl mx-auto px-5 py-8">
        <RentalForm />
      </main>
    </div>
    </Layout>

  );
}