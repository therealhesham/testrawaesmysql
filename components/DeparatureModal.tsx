import { useState } from "react";
import FormStep1 from './FormStep1';
import FormStep2 from './FormStep2';

export default function DepartureModal({ currentStep, onNext, onPrevious, onClose, onSuccess }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);

  const getData = async (s) => {
    // alert(id)
    const getByID = await fetch(`/api/getdatafordeparatures?id=${s}`).then(res => res.json());
    // console.log(getByID.data)
    setData(getByID.data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-gray-100 p-9 border border-gray-300 rounded max-w-2xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-800 text-xl font-bold"
        >
          &times;
        </button>
        {currentStep === 1 ? (
          <FormStep1 onNext={onNext} id={id} setId={setId} data={data} getData={getData} />
        ) : (
          <FormStep2 onPrevious={onPrevious} onClose={onClose} data={data} onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}