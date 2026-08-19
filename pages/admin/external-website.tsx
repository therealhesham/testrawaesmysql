import React, { useState, useEffect } from "react";
import Layout from "example/containers/Layout";
import Head from "next/head";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash } from "react-icons/fa";

export default function ExternalWebsiteControl() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    countryArabic: "",
    countryEnglish: "",
    flagUrl: "",
    price: "",
    oldPrice: "",
    sortOrder: 0,
    isActive: true
  });

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/nationality-cards");
      setCards(data);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      countryArabic: "",
      countryEnglish: "",
      flagUrl: "",
      price: "",
      oldPrice: "",
      sortOrder: cards.length + 1,
      isActive: true
    });
    setShowModal(true);
  };

  const openEditModal = (card) => {
    setEditId(card.id);
    setFormData({
      countryArabic: card.countryArabic,
      countryEnglish: card.countryEnglish,
      flagUrl: card.flagUrl,
      price: card.price,
      oldPrice: card.oldPrice || "",
      sortOrder: card.sortOrder,
      isActive: card.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`/api/nationality-cards/${editId}`, formData);
      } else {
        await axios.post("/api/nationality-cards", formData);
      }
      setShowModal(false);
      fetchCards();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الحفظ");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("هل أنت متأكد من حذف هذه البطاقة؟")) {
      try {
        await axios.delete(`/api/nationality-cards/${id}`);
        fetchCards();
      } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };
  
  const toggleStatus = async (card) => {
      try {
          await axios.put(`/api/nationality-cards/${card.id}`, {...card, isActive: !card.isActive});
          fetchCards();
      }catch(err){
          console.error(err);
          alert("حدث خطأ");
      }
  }

  return (
    <Layout>
      <Head>
        <title>التحكم في الموقع الخارجي</title>
      </Head>
      
      <div className="container mx-auto px-4 py-6" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">بطاقات الجنسيات في الموقع الخارجي</h1>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors"
          >
            <FaPlus /> إضافة بطاقة جديدة
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الترتيب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدولة (عربي)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدولة (إنجليزي)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.sortOrder}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{card.flagUrl}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{card.countryArabic}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.countryEnglish}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {card.oldPrice && (
                            <span className="text-red-500 line-through text-xs block">{card.oldPrice} ريال</span>
                        )}
                        <span>{card.price} ريال</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {card.isActive ? 'ظاهر' : 'مخفي'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleStatus(card)} className="text-gray-600 hover:text-gray-900" title={card.isActive ? "إخفاء" : "إظهار"}>
                           {card.isActive ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button onClick={() => openEditModal(card)} className="text-indigo-600 hover:text-indigo-900" title="تعديل">
                          <FaEdit />
                        </button>
                        <button onClick={() => handleDelete(card.id)} className="text-red-600 hover:text-red-900" title="حذف">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cards.length === 0 && (
                    <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-500">لا يوجد بيانات</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" dir="rtl">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                    {editId ? "تعديل بطاقة" : "إضافة بطاقة جديدة"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الدولة بالعربي</label>
                      <input type="text" name="countryArabic" value={formData.countryArabic} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الدولة بالإنجليزي (مهم للروابط)</label>
                      <input type="text" name="countryEnglish" value={formData.countryEnglish} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">مسار العلم (مثال: /philippines-flag.png)</label>
                      <input type="text" name="flagUrl" value={formData.flagUrl} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">السعر القديم (اختياري / يُعرض مشطوباً)</label>
                      <input type="number" name="oldPrice" value={formData.oldPrice} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">السعر (الجديد / الحالي)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-left" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الترتيب</label>
                      <input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-left" dir="ltr" />
                    </div>
                    <div className="flex items-center mt-4">
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ml-2" />
                      <label className="block text-sm font-medium text-gray-700">تفعيل / إظهار البطاقة في الموقع الخارجي</label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    حفظ
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
