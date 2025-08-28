export default function FormStep1({ onNext, id, setId, data, getData }) {
  return (
    <section id="form-step1">
      <h2 className="text-2xl font-normal text-black text-right mb-12">تسجيل مغادرة</h2>
      <div className="flex items-start justify-center mb-12 px-[20%]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 bg-teal-800 text-white text-md">1</div>
          <span className="text-md text-black whitespace-nowrap">بيانات الطلب</span>
        </div>
        <div className="flex-1 h-px bg-gray-500 mt-3 mx-[-20px]"></div>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-teal-800 text-gray-800 text-md">2</div>
          <span className="text-md text-black whitespace-nowrap">بيانات المغادرة</span>
        </div>
      </div>
      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="order-number" className="text-xs text-gray-500 text-right font-inter">رقم الطلب</label>
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded pl-2">
            <input 
              type="text" 
              id="order-number" 
              className="flex-1 border-none bg-transparent outline-none text-gray-800 text-md p-3" 
              onChange={(e) => setId(e.target.value)} 
              value={id}
              placeholder="ادخل رقم الطلب" 
            />
            <button 
              type="button" 
              className="bg-teal-800 text-white text-md font-tajawal px-4 py-2 rounded" 
              onClick={getData}
            >
              بحث
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-name" className="text-xs text-gray-500 text-right font-inter">اسم العميل</label>
            <input 
              type="text" 
              id="customer-name" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="اسم العميل" 
              value={data?.Order?.client?.fullname || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-id" className="text-xs text-gray-500 text-right font-inter">هوية العميل</label>
            <input 
              type="text" 
              id="customer-id" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="هوية العميل" 
              value={data?.Order?.client?.nationalId || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="customer-city" className="text-xs text-gray-500 text-right font-inter">مدينة العميل</label>
            <input 
              type="text" 
              id="customer-city" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="مدينة العميل" 
              value={data?.Order?.client?.city || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="worker-name" className="text-xs text-gray-500 text-right font-inter">اسم العاملة</label>
            <input 
              type="text" 
              id="worker-name" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="اسم العاملة" 
              value={data?.Order?.HomeMaid?.Name || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="passport-number" className="text-xs text-gray-500 text-right font-inter">رقم الجواز</label>
            <input 
              type="text" 
              id="passport-number" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="رقم الجواز"  
              value={data?.Order?.HomeMaid?.Passportnumber || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="nationality" className="text-xs text-gray-500 text-right font-inter">الجنسية</label>
            <input 
              type="text" 
              id="nationality" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="جنسية العاملة" 
              value={data?.Order?.HomeMaid?.office.Country || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="warranty-status" className="text-xs text-gray-500 text-right font-inter">حالة الضمان</label>
            <input 
              type="text" 
              id="warranty-status" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="حالة الضمان" 
              value={data?.Order?.HomeMaid?.guaranteeStatus || ""} 
              readOnly 
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label htmlFor="remaining-period" className="text-xs text-gray-500 text-right font-inter">المدة المتبقية</label>
            <input 
              type="text" 
              id="remaining-period" 
              className="bg-gray-50 border border-gray-300 rounded p-3 text-gray-800 text-md" 
              placeholder="المدة المتبقية" 
              value={data?.Order?.HomeMaid?.GuaranteeDurationEnd || ""} 
              readOnly 
            />
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onNext}
            className="w-28 py-2 bg-teal-800 text-white text-base rounded font-inter"
          >
            التالي
          </button>
        </div>
      </form>
    </section>
  );
}