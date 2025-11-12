import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';
import type { ChangeEvent } from 'react';
import Layout from 'example/containers/Layout';

interface MainCategory {
  id: number;
  name: string;
  mathProcess: string;
  subs: SubCategory[];
}

interface SubCategory {
  id: number;
  name: string;
  mainCategory_id: number;
  mainCategory?: MainCategory;
}

export default function CategoriesPage() {
  // Main Category States
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [openMainCategoryModal, setOpenMainCategoryModal] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [mainCategoryForm, setMainCategoryForm] = useState({
    name: '',
    mathProcess: 'add',
  });

  // Sub Category States
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [openSubCategoryModal, setOpenSubCategoryModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    mainCategory_id: '',
  });

  const [loading, setLoading] = useState(false);

  // Fetch Main Categories
  const fetchMainCategories = async () => {
    try {
      const res = await axios.get('/api/categories/mainCategory');
      setMainCategories(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch main categories:', error);
      alert('فشل في جلب الفئات الرئيسية');
    }
  };

  // Fetch Sub Categories
  const fetchSubCategories = async () => {
    try {
      const res = await axios.get('/api/categories/subCategory');
      setSubCategories(res.data.items || []);
    } catch (error) {
      console.error('Failed to fetch sub categories:', error);
      alert('فشل في جلب الفئات الفرعية');
    }
  };

  useEffect(() => {
    fetchMainCategories();
    fetchSubCategories();
  }, []);

  // Main Category Handlers
  const handleMainCategoryChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMainCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMainCategory = () => {
    setEditingMainCategory(null);
    setMainCategoryForm({ name: '', mathProcess: 'add' });
    setOpenMainCategoryModal(true);
  };

  const handleEditMainCategory = (category: MainCategory) => {
    setEditingMainCategory(category);
    setMainCategoryForm({
      name: category.name,
      mathProcess: category.mathProcess,
    });
    setOpenMainCategoryModal(true);
  };

  const handleSubmitMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainCategoryForm.name || !mainCategoryForm.mathProcess) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      if (editingMainCategory) {
        // Update
        await axios.put('/api/categories/mainCategory', {
          id: editingMainCategory.id,
          name: mainCategoryForm.name,
          mathProcess: mainCategoryForm.mathProcess,
        });
        alert('تم التحديث بنجاح');
      } else {
        // Create
        await axios.post('/api/categories/mainCategory', mainCategoryForm);
        alert('تمت الإضافة بنجاح');
      }
      setOpenMainCategoryModal(false);
      setMainCategoryForm({ name: '', mathProcess: 'add' });
      setEditingMainCategory(null);
      fetchMainCategories();
      fetchSubCategories(); // Refresh sub categories to update mainCategory relation
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMainCategory = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة الرئيسية؟ سيتم حذف جميع الفئات الفرعية المرتبطة بها.')) {
      return;
    }

    try {
      await axios.delete('/api/categories/mainCategory', { data: { id } });
      alert('تم الحذف بنجاح');
      fetchMainCategories();
      fetchSubCategories();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  // Sub Category Handlers
  const handleSubCategoryChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubCategory = () => {
    setEditingSubCategory(null);
    setSubCategoryForm({ name: '', mainCategory_id: '' });
    setOpenSubCategoryModal(true);
  };

  const handleEditSubCategory = (category: SubCategory) => {
    setEditingSubCategory(category);
    setSubCategoryForm({
      name: category.name,
      mainCategory_id: String(category.mainCategory_id),
    });
    setOpenSubCategoryModal(true);
  };

  const handleSubmitSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCategoryForm.name || !subCategoryForm.mainCategory_id) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      if (editingSubCategory) {
        // Update
        await axios.put('/api/categories/subCategory', {
          id: editingSubCategory.id,
          name: subCategoryForm.name,
          mainCategory_id: Number(subCategoryForm.mainCategory_id),
        });
        alert('تم التحديث بنجاح');
      } else {
        // Create
        await axios.post('/api/categories/subCategory', {
          name: subCategoryForm.name,
          mainCategory_id: Number(subCategoryForm.mainCategory_id),
        });
        alert('تمت الإضافة بنجاح');
      }
      setOpenSubCategoryModal(false);
      setSubCategoryForm({ name: '', mainCategory_id: '' });
      setEditingSubCategory(null);
      fetchSubCategories();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubCategory = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفئة الفرعية؟')) {
      return;
    }

    try {
      await axios.delete('/api/categories/subCategory', { data: { id } });
      alert('تم الحذف بنجاح');
      fetchSubCategories();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'حدث خطأ');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F5] text-gray-900" dir="rtl">
      <Head>
        <title>إدارة الفئات - وصل للاستقدام</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Layout>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 p-4 md:p-8" dir="ltr">
            <h2 className="text-3xl text-black mb-8">إدارة الفئات</h2>

            {/* Main Categories Section */}
            <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#333]">الفئات الرئيسية</h3>
                <button
                  className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
                  onClick={handleAddMainCategory}
                >
                  <span>إضافة فئة رئيسية</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Main Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FA]">
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الاسم</th>
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">نوع العملية</th>
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">عدد الفئات الفرعية</th>
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainCategories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="border border-[#E0E0E0] p-4 text-center text-gray-500">
                          لا توجد فئات رئيسية
                        </td>
                      </tr>
                    ) : (
                      mainCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-[#F8F9FA]">
                          <td className="border border-[#E0E0E0] p-3">{category.name}</td>
                          <td className="border border-[#E0E0E0] p-3">
                            {category.mathProcess === 'add' ? 'إضافة' : 'طرح'}
                          </td>
                          <td className="border border-[#E0E0E0] p-3">{category.subs?.length || 0}</td>
                          <td className="border border-[#E0E0E0] p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMainCategory(category)}
                                className="text-[#1A4D4F] hover:text-[#164044] px-2 py-1"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteMainCategory(category.id)}
                                className="text-red-600 hover:text-red-800 px-2 py-1"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub Categories Section */}
            <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#333]">الفئات الفرعية</h3>
                <button
                  className="bg-[#1A4D4F] text-white rounded-md px-4 py-2 flex items-center gap-2 text-sm hover:bg-[#164044]"
                  onClick={handleAddSubCategory}
                >
                  <span>إضافة فئة فرعية</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Sub Categories Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FA]">
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الاسم</th>
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الفئة الرئيسية</th>
                      <th className="border border-[#E0E0E0] p-3 text-right text-[#333] font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subCategories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border border-[#E0E0E0] p-4 text-center text-gray-500">
                          لا توجد فئات فرعية
                        </td>
                      </tr>
                    ) : (
                      subCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-[#F8F9FA]">
                          <td className="border border-[#E0E0E0] p-3">{category.name}</td>
                          <td className="border border-[#E0E0E0] p-3">
                            {mainCategories.find((mc) => mc.id === category.mainCategory_id)?.name || 'غير معروف'}
                          </td>
                          <td className="border border-[#E0E0E0] p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditSubCategory(category)}
                                className="text-[#1A4D4F] hover:text-[#164044] px-2 py-1"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteSubCategory(category.id)}
                                className="text-red-600 hover:text-red-800 px-2 py-1"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Main Category Modal */}
            {openMainCategoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setOpenMainCategoryModal(false)} />
                <div className="relative bg-[#F8F9FA] p-8 rounded-[10px] w-full max-w-[500px] mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-center mb-0 text-[22px] text-[#333]">
                      {editingMainCategory ? 'تعديل فئة رئيسية' : 'إضافة فئة رئيسية'}
                    </h2>
                    <button
                      aria-label="close"
                      onClick={() => {
                        setOpenMainCategoryModal(false);
                        setEditingMainCategory(null);
                        setMainCategoryForm({ name: '', mathProcess: 'add' });
                      }}
                      className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleSubmitMainCategory}>
                    <div className="space-y-5 mb-8">
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">اسم الفئة الرئيسية</label>
                        <input
                          name="name"
                          value={mainCategoryForm.name}
                          onChange={handleMainCategoryChange}
                          type="text"
                          placeholder="أدخل اسم الفئة الرئيسية"
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">نوع العملية الحسابية</label>
                        <select
                          name="mathProcess"
                          value={mainCategoryForm.mathProcess}
                          onChange={handleMainCategoryChange}
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                          required
                        >
                          <option value="add">إضافة</option>
                          <option value="subtract">طرح</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:[direction:ltr] [direction:rtl]">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-white bg-[#1A4D4F] hover:bg-[#164044] disabled:opacity-50"
                      >
                        {loading ? 'جاري الحفظ...' : editingMainCategory ? 'تحديث' : 'إضافة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMainCategoryModal(false);
                          setEditingMainCategory(null);
                          setMainCategoryForm({ name: '', mathProcess: 'add' });
                        }}
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Sub Category Modal */}
            {openSubCategoryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/30" onClick={() => setOpenSubCategoryModal(false)} />
                <div className="relative bg-[#F8F9FA] p-8 rounded-[10px] w-full max-w-[500px] mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-center mb-0 text-[22px] text-[#333]">
                      {editingSubCategory ? 'تعديل فئة فرعية' : 'إضافة فئة فرعية'}
                    </h2>
                    <button
                      aria-label="close"
                      onClick={() => {
                        setOpenSubCategoryModal(false);
                        setEditingSubCategory(null);
                        setSubCategoryForm({ name: '', mainCategory_id: '' });
                      }}
                      className="text-[#1A4D4F] hover:text-[#164044] text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleSubmitSubCategory}>
                    <div className="space-y-5 mb-8">
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">اسم الفئة الفرعية</label>
                        <input
                          name="name"
                          value={subCategoryForm.name}
                          onChange={handleSubCategoryChange}
                          type="text"
                          placeholder="أدخل اسم الفئة الفرعية"
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="mb-2 font-bold text-[#333]">الفئة الرئيسية</label>
                        <select
                          name="mainCategory_id"
                          value={subCategoryForm.mainCategory_id}
                          onChange={handleSubCategoryChange}
                          className="p-[10px] border border-[#CCC] rounded-[6px] bg-white"
                          required
                        >
                          <option value="">اختر الفئة الرئيسية</option>
                          {mainCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-center space-y-3 sm:space-y-0 sm:space-x-4 sm:[direction:ltr] [direction:rtl]">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-white bg-[#1A4D4F] hover:bg-[#164044] disabled:opacity-50"
                      >
                        {loading ? 'جاري الحفظ...' : editingSubCategory ? 'تحديث' : 'إضافة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenSubCategoryModal(false);
                          setEditingSubCategory(null);
                          setSubCategoryForm({ name: '', mainCategory_id: '' });
                        }}
                        className="inline-flex justify-center items-center px-6 py-2 rounded-[6px] text-[14px] font-bold text-[#1A4D4F] border-2 border-[#1A4D4F] hover:bg-[#1A4D4F] hover:text-white"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </Layout>
    </div>
  );
}

