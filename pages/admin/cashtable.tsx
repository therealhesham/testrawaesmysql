import EditCashModal from "components/editcashmodal";
import Layout from "example/containers/Layout";
import { useState, useEffect } from "react";

export default function CashTable() {
  const [cashData, setCashData] = useState([]);
  const [selectedCash, setSelectedCash] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch("/api/addcash");
    const data = await res.json();
    setCashData(data);
  };

  const handleEdit = (cash) => {
    setSelectedCash(cash);
    setIsModalOpen(true);
  };

  const handleModalSave = (updatedCash) => {
    setCashData((prev) =>
      prev.map((item) => (item.id === updatedCash.id ? updatedCash : item))
    );
  };

  return (
    <Layout>
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">القيمة</th>
              <th className="py-3 px-4">النوع</th>
              <th className="py-3 px-4">الشهر</th>
              <th className="py-3 px-4">السنة</th>
              <th className="py-3 px-4">المصروف</th>
              <th className="py-3 px-4">المتبقي</th>
              <th className="py-3 px-4">تعديل</th>
            </tr>
          </thead>
          <tbody>
            {cashData.map((cash, index) => (
              <tr
                key={cash.id}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2 px-4">{index + 1}</td>
                <td className="py-2 px-4">{cash.amount} ج.م</td>
                <td className="py-2 px-4">{cash.transaction_type}</td>
                <td className="py-2 px-4">{cash.Month}</td>
                <td className="py-2 px-4">{cash.Year}</td>
                <td className="py-2 px-4">{cash.spent} ر.س</td>
                <td className="py-2 px-4">{cash.remaining} ر.س</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => handleEdit(cash)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <EditCashModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cashData={selectedCash || {}}
          onSave={handleModalSave}
        />
      </div>
    </Layout>
  );
}
// import EditCashModal from "components/editcashmodal";
// import Layout from "example/containers/Layout";
// import { useState, useEffect } from "react";
// export default function CashTable() {
//   const [cashData, setCashData] = useState([]);
//   const [selectedCash, setSelectedCash] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     const res = await fetch("/api/addcash");
//     const data = await res.json();
//     setCashData(data);
//   };

//   const handleEdit = (cash) => {
//     setSelectedCash(cash);
//     setIsModalOpen(true);
//   };

//   const handleModalSave = (updatedCash) => {
//     setCashData((prev) =>
//       prev.map((item) => (item.id === updatedCash.id ? updatedCash : item))
//     );
//   };

//   return (
//     <Layout>
//       <div className="overflow-x-auto mt-6">
//         <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
//           <thead>
//             <tr className="bg-gray-100 text-gray-700 text-left">
//               <th className="py-3 px-4">#</th>
//               <th className="py-3 px-4">القيمة</th>
//               <th className="py-3 px-4">النوع</th>
//               <th className="py-3 px-4">الشهر</th>
//               <th className="py-3 px-4">السنة</th>
//               <th className="py-3 px-4">تعديل</th>
//             </tr>
//           </thead>
//           <tbody>
//             {cashData.map((cash, index) => (
//               <tr
//                 key={cash.id}
//                 className="border-t border-gray-100 hover:bg-gray-50"
//               >
//                 <td className="py-2 px-4">{index + 1}</td>
//                 <td className="py-2 px-4">{cash.amount} ج.م</td>
//                 <td className="py-2 px-4">{cash.transaction_type}</td>
//                 <td className="py-2 px-4">{cash.Month}</td>
//                 <td className="py-2 px-4">{cash.Year}</td>
//                 <td className="py-2 px-4">
//                   <button
//                     onClick={() => handleEdit(cash)}
//                     className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
//                   >
//                     تعديل
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         <EditCashModal
//           isOpen={isModalOpen}
//           onClose={() => setIsModalOpen(false)}
//           cashData={selectedCash || {}}
//           onSave={handleModalSave}
//         />
//       </div>
//     </Layout>
//   );
// }
