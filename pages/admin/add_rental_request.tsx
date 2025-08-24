import RentalForm from 'components/RentalForm';
import Head from 'next/head';

export default function AddRentalRequest() {
  return (
    <div className="min-h-screen bg-gray-100 font-tajawal" dir="rtl">
      <Head>
        <title>إضافة طلب تأجير</title>
      </Head>
      <main className="max-w-7xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-normal text-right text-gray-900 mb-10">طلب تاجير</h1>
        <RentalForm/>
      </main>
    </div>
  );
}