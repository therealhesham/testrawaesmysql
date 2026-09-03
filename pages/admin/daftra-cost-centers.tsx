import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';
import Layout from 'example/containers/Layout';

export default function DaftraCostCentersPage() {
  const [subdomain, setSubdomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCostCenters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain || !apiKey) {
      setError('يرجى إدخال الدومين الفرعي ومفتاح API');
      return;
    }

    setLoading(true);
    setError('');
    setCostCenters([]);

    try {
      const res = await axios.post('/api/daftra/cost-centers', {
        subdomain,
        apiKey,
      });

      if (res.data && res.data.data) {
        setCostCenters(res.data.data);
      } else {
        setError('لا توجد بيانات أو استجابة غير متوقعة من API');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'حدث خطأ أثناء جلب مراكز التكلفة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>مراكز التكلفة - دفترة</title>
      </Head>
      <Layout>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4 md:p-8">
            <h2 className="text-3xl text-black mb-8">اختبار ربط مراكز التكلفة (دفترة)</h2>

            <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 mb-8 max-w-2xl">
              <form onSubmit={fetchCostCenters} className="space-y-4">
                <div>
                  <label className="block mb-2 font-bold text-[#333]">الدومين الفرعي (Subdomain)</label>
                  <div className="flex items-center" dir="ltr">
                    <span className="p-[10px] bg-gray-200 border border-gray-300 rounded-l-[6px] text-gray-600">
                      https://
                    </span>
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      placeholder="example"
                      className="p-[10px] border border-[#CCC] bg-white flex-1 focus:outline-none focus:border-[#1A4D4F]"
                      required
                    />
                    <span className="p-[10px] bg-gray-200 border border-gray-300 rounded-r-[6px] text-gray-600">
                      .daftra.com
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-[#333]">مفتاح API (API Key)</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="أدخل مفتاح API الخاص بك"
                    className="p-[10px] border border-[#CCC] rounded-[6px] bg-white w-full focus:outline-none focus:border-[#1A4D4F]"
                    dir="ltr"
                    required
                  />
                </div>

                {error && <div className="text-red-500 font-bold">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-[6px] text-[14px] font-bold text-white bg-[#1A4D4F] hover:bg-[#164044] disabled:opacity-50"
                >
                  {loading ? 'جاري الجلب...' : 'جلب مراكز التكلفة'}
                </button>
              </form>
            </div>

            {costCenters.length > 0 && (
              <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6">
                <h3 className="text-2xl text-[#333] mb-6">قائمة مراكز التكلفة ({costCenters.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA]">
                        <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">المعرف (ID)</th>
                        <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الرمز (Code)</th>
                        <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الاسم</th>
                        <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">مفعل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costCenters.map((item: any, index: number) => {
                        const cc = item.CostCenter || item;
                        return (
                          <tr key={cc.id || index} className="hover:bg-[#F8F9FA]">
                            <td className="border border-[#E0E0E0] p-3">{cc.id || '-'}</td>
                            <td className="border border-[#E0E0E0] p-3">{cc.code || '-'}</td>
                            <td className="border border-[#E0E0E0] p-3">{cc.name || cc.name_en || '-'}</td>
                            <td className="border border-[#E0E0E0] p-3">
                              <span className={`px-2 py-1 rounded text-xs text-white ${cc.active == 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                                {cc.active == 1 ? 'نعم' : 'لا'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </Layout>
    </div>
  );
}
