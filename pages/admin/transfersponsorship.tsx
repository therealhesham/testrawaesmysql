import { useState } from 'react';
import Head from 'next/head';
import Layout from 'example/containers/Layout';
import Style from "styles/Home.module.css";
// import AddTransactionForm from 'pages/admin/AddTransactionForm';
import ServiceTransferTable from 'components/ServiceTransferTable';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  const handleEditTransaction = (id: number) => {
    setTransactionId(id);
    setShowForm(true);
  };

  return (
    <Layout>
      <Head>
        <title>معاملات نقل الخدمات</title>
      </Head>
      <div className={`min-h-screen  ${Style["tajawal-medium"]}`} dir="rtl">
        <div className="max-w-7xl mx-auto p-6">
         
            <ServiceTransferTable
              onAddTransaction={() => setShowForm(true)}
              onEditTransaction={handleEditTransaction}
            />
     
        </div>
      </div>
    </Layout>
  );
}