import { useState } from "react";

const Modal = ({ isOpen, onClose, onSubmit, id, reRender }) => {
  const [inputValue, setInputValue] = useState("");
  const [deparatureCity, setDeparatureCity] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [date, setDeparatureDate] = useState(new Date().toLocaleDateString());
  const [time, setDeparatureTime] = useState("");
  const handleSubmit = async () => {
    const response = await fetch("/api/confirmhousing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        homeMaidId: id,
        profileStatus: "مغادرة",
        deparatureCity,
        arrivalCity,
        deparatureDate: date,
        DeparatureTime: time,
      }),
    });

    if (response.status == 200) {
      reRender();
      onClose();
    }
  };
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">بيانات المغادرة</h2>
        <input
          type="text"
          className="border p-2 w-full rounded-md mb-4"
          value={deparatureCity}
          onChange={(e) => setDeparatureCity(e.target.value)}
          placeholder="مدينة المغادرة"
        />
        <input
          type="text"
          className="border p-2 w-full rounded-md mb-4"
          value={arrivalCity}
          onChange={(e) => setArrivalCity(e.target.value)}
          placeholder="بلد الوصول"
        />
        <input
          type="date"
          className="border p-2 w-full rounded-md mb-4"
          value={date}
          onChange={(e) => setDeparatureDate(e.target.value)}
          placeholder="التاريخ"
        />
        <input
          type="time"
          className="border p-2 w-full rounded-md mb-4"
          value={time}
          onChange={(e) => setDeparatureTime(e.target.value)}
          placeholder="التوقيت"
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Close
          </button>

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
