import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import prisma from "pages/api/globalprisma";
import Layout from "example/containers/Layout";
import { NextPageContext } from "next";

// مكون Modal مخصص
const Modal = ({ isOpen, onClose, title, message, isSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2
          className={`text-xl font-bold mb-4 ${
            isSuccess ? "text-green-600" : "text-red-600"
          }`}
        >
          {title}
        </h2>
        <p className="mb-6">{message}</p>
        <button
          onClick={onClose}
          className={`w-full py-2 rounded ${
            isSuccess
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default function NewHomemaid({ offices }) {
  const [form, setForm] = useState<any>({});
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cloudinaryImage, setCloudinaryImage] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [Nationalitycopy, setNationalitycopy] = useState("");
  const router = useRouter();

  // حالات للتحكم في الـ Modals
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleOfficeChange = (e) => {
    setOfficeName(e.target.value);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setImage(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "z8q1vykv");
    formData.append("cloud_name", "duo8svqci");
    formData.append("folder", "samples");

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/duo8svqci/image/upload`,
        formData
      );
      setCloudinaryImage(response.data.secure_url);
      setPreview(response.data.secure_url);
    } catch (error) {
      console.error("Upload failed", error);
      setErrorMessage("فشل رفع الصورة. حاول مرة أخرى.");
      setIsErrorModalOpen(true);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const body = [
      {
        fields: {
          Picture: [{ url: cloudinaryImage }],
          "Name - الاسم": form.Name,
          "Nationality copy": Nationalitycopy,
          "Religion - الديانة": form.Religion,
          "marital status - الحالة الاجتماعية": form.maritalstatus,
          "Education -  التعليم": form.Education,
          "Experience - الخبرة": form.Experience,
          "Passport number - رقم الجواز": form.Passportnumber,
          "Arabic -  العربية": form.ArabicLanguageLeveL,
          "English - الانجليزية": form.EnglishLanguageLevel,
          "Salary - الراتب": form.Salary,
          "laundry - الغسيل": form.LaundryLeveL,
          "Ironing - كوي": form.IroningLevel,
          "cleaning - التنظيف": form.CleaningLeveL,
          "Cooking - الطبخ": form.CookingLeveL,
          "sewing - الخياطة": form.SewingLeveL,
          "Babysitting - العناية بالأطفال": form.BabySitterLevel,
          "date of birth - تاريخ الميلاد": form.dateofbirth,
        },
      },
    ];

    try {
      const res = await fetch("/api/createhomemaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsSuccessModalOpen(true); // إظهار Success Modal
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.message || "حدث خطأ أثناء الحفظ.");
        setIsErrorModalOpen(true); // إظهار Error Modal
      }
    } catch (error) {
      console.error("Submission failed", error);
      setErrorMessage("حدث خطأ غير متوقع. حاول مرة أخرى.");
      setIsErrorModalOpen(true); // إظهار Error Modal
    }
  };

  const filteredOffices = offices.filter((office) =>
    office?.office?.toLowerCase().includes(officeName.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white p-8 shadow rounded">
          <h1 className="text-2xl font-bold mb-6">اضافة سيرة ذاتية</h1>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Input name="Name" label="الاسم بالكامل" onChange={handleChange} />

            <div className="mb-4">
              <label
                htmlFor="religion"
                className="block text-sm font-medium text-gray-700"
              >
                الديانة
              </label>
              <select
                name="religion"
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="اختر الديانة"
              >
                <option value="Non-Muslim - غير مسلم">غير مسلم</option>
                <option value="Islam - الإسلام">مسلم</option>
                <option value="Christianity - المسيحية">مسيحي</option>
              </select>
            </div>

            <Input
              name="Passportnumber"
              label="رقم جواز السفر"
              onChange={handleChange}
            />
            <Input
              name="ExperienceYears"
              label="سنوات الخبرة"
              onChange={handleChange}
            />
            <Input
              name="maritalstatus"
              label="الحالة الاجتماعية"
              onChange={handleChange}
            />
            <Input name="Experience" label="الخبرة" onChange={handleChange} />
            <Input
              type="date"
              name="dateofbirth"
              label="تاريخ الميلاد"
              onChange={handleChange}
            />
            <Input name="phone" label="رقم الهاتف" onChange={handleChange} />
            <Input name="Education" label="التعليم" onChange={handleChange} />

            <LevelSelect
              name="ArabicLanguageLeveL"
              label="مستوى اللغة العربية"
              onChange={handleChange}
            />
            <LevelSelect
              name="EnglishLanguageLevel"
              label="مستوى اللغة الانجليزية"
              onChange={handleChange}
            />
            <LevelSelect
              name="LaundryLeveL"
              label="الغسيل"
              onChange={handleChange}
            />
            <LevelSelect
              name="IroningLevel"
              label="الكوي"
              onChange={handleChange}
            />
            <LevelSelect
              name="CleaningLeveL"
              label="التنظيف"
              onChange={handleChange}
            />
            <LevelSelect
              name="CookingLeveL"
              label="الطبخ"
              onChange={handleChange}
            />
            <LevelSelect
              name="SewingLeveL"
              label="الخياطة"
              onChange={handleChange}
            />
            <LevelSelect
              name="BabySitterLevel"
              label="العناية بالأطفال"
              onChange={handleChange}
            />
            <Input name="Salary" label="Salary" onChange={handleChange} />

            {/* Office AutoComplete */}
            <div className="mb-4 col-span-2">
              <label
                htmlFor="externalOfficeStatus"
                className="block text-sm font-medium text-gray-700"
              >
                اسم المكتب الخارجي
              </label>
              <input
                autoComplete="off"
                type="text"
                id="externalOfficeStatus"
                value={officeName}
                onChange={handleOfficeChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="ابدأ بالكتابة لاختيار أو إضافة مكتب"
              />
              {officeName && (
                <ul className="mt-2 border border-gray-300 rounded-md bg-white shadow-md max-h-40 overflow-auto">
                  {filteredOffices
                    .filter((office) => office.office !== officeName)
                    .map((office, index) => (
                      <li
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          setNationalitycopy(office.Country);
                          setOfficeName(office.office);
                        }}
                      >
                        {office.office}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Image Upload */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="mt-2"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-4 w-40 h-40 object-cover rounded"
                />
              )}
            </div>

            <button
              type="submit"
              className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Save CV
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          // router.push("/");
        }}
        title="تم الحفظ بنجاح!"
        message="تم حفظ السيرة الذاتية بنجاح."
        isSuccess={true}
      />

      {/* Error Modal */}
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title="خطأ!"
        message={errorMessage}
        isSuccess={false}
      />
    </Layout>
  );
}

const Input = ({ name, label, onChange, type }: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type={type || "text"}
      id={name}
      name={name}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const LevelSelect = ({ name, label, onChange }: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <select
      id={name}
      name={name}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">اختر المستوى</option>
      <option value="Novice | مدربة بدون خبرة">Novice | مدربة بدون خبرة</option>
      <option value="Intermediate - جيد">Intermediate - جيد</option>
      <option value="Advanced - جيد جداً">Advanced - جيد جداً</option>
      <option value="Expert - ممتاز">Expert - ممتاز</option>
    </select>
  </div>
);

export async function getServerSideProps(context: NextPageContext) {
  const offices = await prisma.offices.findMany();
  return { props: { offices } };
}
