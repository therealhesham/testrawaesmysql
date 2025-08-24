import RequestsTable from 'components/RequestTable';
import Layout from 'example/containers/Layout';
import Head from 'next/head';

export default function RequestsInProgress() {
  return (
    <Layout>    <div className="min-h-screen bg-gray-100 font-tajawal" dir="rtl">
      <Head>
        <title>طلبات تحت الإجراء</title>
      </Head>
      <main className="max-w-7xl mx-auto px-5 py-8">
        <h1 className="text-3xl font-normal text-right text-gray-900 mb-6">طلبات تحت الإجراء</h1>
        <RequestsTable />
      </main>
    </div>
    </Layout>

  );
}