import { useEffect, useState, useRef } from 'react';
import { X, ChevronDown, CheckCircle } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClientModal = ({ isOpen, onClose }: AddClientModalProps) => {

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullname: '',
    phonenumber: '',
    nationalId: '',
    city: '',
    clientSource: '',
    hasVisa: 'yes',
    visaNumber: '',
    nationality: '',
    gender: '',
    profession: '',
    visaFile: '', // Store URL instead of File
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [nationalities, setNationalities] = useState<any[]>([]);
  const [fileUploaded, setFileUploaded] = useState({
    visaFile: false,
  });
  const [errors, setErrors] = useState<any>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const fetchNationalities = async () => {
  const response = await fetch('/api/nationalities');
  const data = await response.json();
  setNationalities(data.nationalities);
};

  useEffect(() => {
    fetchNationalities();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setErrors((prev: any) => ({ ...prev, visaFile: 'لم يتم اختيار ملف' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
      return;
    }

    const file = files[0];
    if (!allowedFileTypes.includes(file.type)) {
      setErrors((prev: any) => ({ ...prev, visaFile: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
      return;
    }

    try {
      const res = await fetch(`/api/upload-presigned-url/visaFile`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('فشل في رفع الملف');
      }

      setFormData((prev: any) => ({ ...prev, visaFile: filePath }));
      setErrors((prev: any) => ({ ...prev, visaFile: '' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: true }));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setErrors((prev: any) => ({ ...prev, visaFile: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded((prev: any) => ({ ...prev, visaFile: false }));
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input reference is not defined');
      setErrors((prev: any) => ({ ...prev, visaFile: 'خطأ في تحديد حقل الملف' }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: formData.fullname,
          phonenumber: formData.phonenumber,
          nationalId: formData.nationalId,
          city: formData.city,
          clientSource: formData.clientSource,
          visaFile: formData.visaFile, // Now contains URL
          visaNumber: formData.visaNumber,
          nationality: formData.nationality,
          gender: formData.gender,
          profession: formData.profession,
        }),
      });
      if (!response.ok) {
        throw new Error('فشل في إضافة العميل');
      }
      onClose();
      setFormData({
        fullname: '',
        phonenumber: '',
        nationalId: '',
        city: '',
        clientSource: '',
        hasVisa: 'yes',
        visaNumber: '',
        nationality: '',
        gender: '',
        profession: '',
        visaFile: '',
      });
      setFileUploaded({ visaFile: false });
      setErrors({});
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <X
          className="absolute top-4 left-4 text-2xl cursor-pointer text-primary-dark"
          onClick={onClose}
        />
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
        {step === 1 ? (
          <section className="space-y-6">
            <h2 className="text-2xl font-medium text-text-dark">إضافة عميل</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">1</div>
                <span className="text-sm text-text-dark">بيانات أساسية</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-6 h-6 bg-border-color text-text-dark rounded-full flex items-center justify-center">2</div>
                <span className="text-sm text-text-dark">بيانات التأشيرة</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullname" className="block text-sm font-medium text-text-dark">الاسم</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  placeholder="ادخل اسم العميل"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full bg-background-light border border-border-color rounded-md py-2 px-4 text-sm text-text-dark"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phonenumber" className="block text-sm font-medium text-text-dark">الرقم</label>
                <input
                  type="text"
                  id="phonenumber"
                  name="phonenumber"
                  placeholder="ادخل رقم العميل"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                  className="w-full bg-background-light border border-border-color rounded-md py-2 px-4 text-sm text-text-dark"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="nationalId" className="block text-sm font-medium text-text-dark">الهوية</label>
                <input
                  type="text"
                  id="nationalId"
                  name="nationalId"
                  placeholder="ادخل هوية العميل"
                  value={formData.nationalId}
                  onChange={handleInputChange}
                  className="w-full bg-background-light border border-border-color rounded-md py-2  text-sm text-text-dark"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-text-dark">المدينة</label>
                <div className="relative">
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-background-light border border-border-color rounded-md py-2 text-sm text-text-dark appearance-none"
                  >
                    <option value="">اختر المدينة</option>
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    {/* Add more cities as needed */}
                  </select>
                  {/* <ChevronDown
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  /> */}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="clientSource" className="block text-sm font-medium text-text-dark">مصدر العميل</label>
                <div className="relative">
                  <select
                    id="clientSource"
                    name="clientSource"
                    value={formData.clientSource}
                    onChange={handleInputChange}
                    className="w-full bg-background-light border border-border-color rounded-md py-2 text-sm text-text-dark appearance-none"
                  >
                    <option value="">اختر مصدر العميل</option>
                    <option value="تسويق">تسويق</option>
                    <option value="إعلان">إعلان</option>
                    {/* Add more sources as needed */}
                  </select>
                  {/* <ChevronDown
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  /> */}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-dark">هل لدى العميل تأشيرة؟</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasVisa"
                      value="yes"
                      checked={formData.hasVisa === 'yes'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    نعم
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="hasVisa"
                      value="no"
                      checked={formData.hasVisa === 'no'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    لا
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-primary-dark text-text-light px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                onClick={() => formData.hasVisa === 'yes' ? setStep(2) : handleSubmit()}
                disabled={loading}
              >
                {formData.hasVisa === 'yes' ? 'التالي' : 'حفظ'}
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <h2 className="text-2xl font-medium text-text-dark">إضافة تأشيرة</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm text-text-dark">بيانات أساسية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-dark text-text-light rounded-full flex items-center justify-center">2</div>
                <span className="text-sm text-text-dark">بيانات التأشيرة</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="visaNumber" className="block text-sm font-medium text-text-dark">رقم التأشيرة</label>
                <input
                  type="text"
                  id="visaNumber"
                  name="visaNumber"
                  placeholder="ادخل رقم التأشيرة"
                  value={formData.visaNumber}
                  onChange={handleInputChange}
                  className="w-full bg-background-light border border-border-color rounded-md py-2 px-4 text-sm text-text-dark"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="nationality" className="block text-sm font-medium text-text-dark">الجنسية</label>
                <div className="relative">
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="w-full bg-background-light border border-border-color rounded-md py-2  text-sm text-text-dark appearance-none"
                  >
                    <option value="">اختر الجنسية</option>
                    {nationalities.map((nationality) => (
                      <option key={nationality.id} value={nationality.value}>{nationality.value as string}</option>
                    ))}
                    {/* Add more nationalities as needed */}
                  </select>
                  {/* <ChevronDown
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  /> */}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-dark">الجنس</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />  
                    ذكر
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                      className="text-primary-dark"
                    />
                    أنثى
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="profession" className="block text-sm font-medium text-text-dark">المهنة</label>
                <div className="relative">
                  <select
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className="w-full bg-background-light border border-border-color rounded-md py-2  text-sm text-text-dark appearance-none"
                  >
                    <option value="">اختر المهنة</option>
                    <option value="عاملة منزلية">عاملة منزلية</option>
                    <option value="سائق">سائق</option>
                    {/* Add more professions as needed */}
                  </select>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="visaFile" className="block text-sm font-medium text-text-dark">ملف التأشيرة</label>
                <div className="file-upload-display border border-gray-300 rounded p-2 flex justify-between items-center">
                  <span className="text-gray-500 text-sm pr-2">
                    {fileUploaded.visaFile ? (
                      <a
                        href={formData.visaFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-800 hover:underline"
                      >
                        فتح الملف
                      </a>
                    ) : (
                      'إرفاق ملف التأشيرة'
                    )}
                  </span>
                  <input
                    type="file"
                    id="visaFile"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    className={`px-3 py-1 rounded text-sm transition duration-200 ${
                      loading 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-teal-900 text-white hover:bg-teal-800'
                    }`}
                    onClick={handleButtonClick}
                  >
                    اختيار ملف
                  </button>
                </div>
                {errors.visaFile && <p className="text-red-500 text-xs mt-1">{errors.visaFile}</p>}
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-primary-dark text-text-light px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                السابق
              </button>
              <button
                type="button"
                className="bg-primary-dark text-text-light px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 min-w-[155px]"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'جاري الحفظ...' : 'حفظ & إضافة طلب'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AddClientModal;