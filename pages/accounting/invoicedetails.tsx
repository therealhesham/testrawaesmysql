"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "components/accSidebar";
import Style from "styles/Home.module.css";
import { useRouter } from "next/router";
import { Autocomplete, TextField } from "@mui/material";

export default function InvoiceEditor() {
  const [companyName, setCompanyName] = useState("Company Name Example");
  const [companyAddress, setCompanyAddress] = useState(
    "123 Business St, City, State, ZIP"
  );
  const [clientName, setClientName] = useState("Client Name Example");
  const [clientAddress, setClientAddress] = useState(
    "456 Client St, City, State, ZIP"
  );
  const [data, setData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const router = useRouter();
  const [date, setDate] = useState(Date.now());

  const fetchData = async () => {
    const fetcher = await fetch(
      "/api/getclientstransactions?customerId=" +
        router.query.client +
        "&" +
        "homemaidId=" +
        router.query.homemaidId
    );
    const res = await fetcher.json();
    console.log(res); // Changed from setDatasets to setData
    setData(res);
  };
  const fetchIncomeData = async () => {
    const fetcher = await fetch(
      "/api/incomedetails?customerId=" +
        router.query.client +
        "&" +
        "homemaidId=" +
        router.query.homemaidId
    );
    const res = await fetcher.json();
    console.log(res); // Changed from setDatasets to setData
    setIncomeData(res);
  };
  const [cv, setCv] = useState({
    arrivals: [{ InternalmusanedContract: true }],
  });
  const fetchCv = async () => {
    const fetchData = await fetch(
      "/api/findcvbyorders?query=" + router.query.homemaidId,
      {
        cache: "default",
      }
    );
    const parser = await fetchData.json();
    setCv(parser);
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };
  const handleUpdateInvoice = (invoice) => {
    openEditModal(invoice);
  };
  const [incomeAmount, onChangeIncomeAmount] = useState("");
  const [inComeDetails, onChangeIncomeDetails] = useState("");

  const handleUpdateSubmit = async () => {
    const updateResponse = await fetch("/api/updateinvoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: selectedInvoice.transaction_type,
        id: selectedInvoice.transaction_id,
        order_id: selectedInvoice.order_id,
        details: selectedInvoice.Details,
        amount: selectedInvoice.amount,
      }),
    });

    if (updateResponse.ok) {
      closeEditModal(); // Close modal after successful update
      // Optionally refetch the data if needed
      fetchData(); // Refresh data to reflect the updated invoice
    } else {
      alert("فشل التحديث");
    }
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedInvoice(null); // Reset selected invoice data when closing
  };

  // const fetchData = async () => {
  //   const fetcher = await fetch(
  //     "/api/getclientstransactions?customerId=" +
  //       router.query.client +
  //       "&" +
  //       "homemaidId=" +
  //       router.query.homemaidId
  //   );
  //   const res = await fetcher.json();
  //   setData(res); // Changed from setDatasets to setData
  // };

  useEffect(() => {
    if (!router.query.homemaidId) return;
    fetchCv();
    fetchData();
    fetchIncomeData();
  }, [router.query, date]);

  // // Check if no data is returned
  // useEffect(() => {
  //   if (data.length === 0) {
  //     setIsModalOpen(true); // Open modal if no data
  //   }
  // }, [data]);

  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState("");
  const [detail, setDetails] = useState("");

  //   // Create new invoice handler
  // const  handleUpdateInvoice = async()=>{

  // }
  const [newCreditAmount, setNewCreditAmount] = useState(0);
  const [newDebitAmount, setNewDebitAmount] = useState(0);
  const [newtype, SetNewType] = useState("");
  const [newdetails, setNewDetails] = useState("");

  const onChangeCreditor = (n) => {
    setNewDebitAmount(0);
    setNewCreditAmount(n);
    SetNewType("creditor");
  };

  const onChangeDebtor = (n) => {
    setNewCreditAmount(0);
    setNewDebitAmount(n);
    SetNewType("debtor");
  };

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }
  const inComedateRef = useRef();
  const dateRef = useRef();
  const handleCreateInvoice = async () => {
    const create = await fetch("/api/getclientstransactions", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: router.query.homemaidId,
        details: newdetails,
        date: dateRef.current.value,
        amount:
          newCreditAmount > newDebitAmount ? newCreditAmount : newDebitAmount,
        transaction_type:
          newCreditAmount > newDebitAmount ? "creditor" : "debtor",
      }),
    });
    if (create.status == 200) {
      fetchData();
    }
    // Logic to create an invoice (You can redirect to a new invoice page or trigger an action)
    // console.log("Create New Invoice");
    setIsModalOpen(false);
  };

  const handleCreateIncome = async () => {
    const create = await fetch("/api/createincome", {
      method: "post",
      headers: {
        Accept: "application/json",

        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: incomeAmount,
        details: inComeDetails,
        order_id: router.query.homemaidId,
        date: inComedateRef.current.value,
      }),
    });
    if (create.status == 200) {
      setDate(Date.now());
      // fetchData();
    }
    // Logic to create an invoice (You can redirect to a new invoice page or trigger an action)
    // console.log("Create New Invoice");
    setIsModalOpen(false);
  };

  // const onChoose = {

  //   alert()
  // }

  const da = [
    "سداد رسوم مبلغ العقد من العميل  لاستقدام العامله  ( سداد لمساند ) ",
    "خصم عمولة مساند 2.4% وتحويل المبلغ بعد خصم العموله للمكتب ",
    "ضريبه علي تكاليف الاستقدام المباشره ",
    "سداد تفويض العامله  35.5 دولار ",
    "رسوم وعمولة المكتب لاستقدام العامله",
    "عمولة وبدلات - ( وصول العامله )",
    "تذكرة باص لنقل العامله ",
  ];
  const [entries, setEntries] = useState([
    { debit: 500, credit: 0, description: "خدمة تصميم", date: "2025-02-21" },
    { debit: 0, credit: 300, description: "دفع من العميل", date: "2025-02-20" },
  ]);
  const [isSwitchOn, setIsSwitchOn] = useState(true);

  const [paidAmount, setPaidAmount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // const addRow = () => {
  //   setData([
  //     ...entries,
  //     { debit: 0, credit: 0, description: "", date: "" },
  //   ]);
  // };

  const handleInputChange = (index, field, value) => {
    const updatedEntries = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setEntries(updatedEntries);
  };

  const removeRow = (index) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const calculateBalance = (debit, credit) => {
    return debit - credit;
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div
        className="mx-auto p-6 overflow-y-auto scrollbar-hide bg-white shadow-lg rounded-lg"
        dir="rtl"
      >
        <div className="flex flex-row justify-center">
          <div
            onClick={() => setIsSwitchOn(true)}
            className="bg-purple-500 w-[200px] cursor-pointer text-white p-6 rounded-lg shadow-lg flex justify-center items-center"
          >
            <div>
              <h2 className="text-xl font-semibold">فاتورة</h2>
            </div>
          </div>

          <div
            onClick={() => setIsSwitchOn(false)}
            className="bg-pink-500 text-white w-[200px] cursor-pointer p-6 rounded-lg shadow-lg flex justify-center items-center"
          >
            <div>
              <h2 className="text-xl font-semibold">قائمة الدخل</h2>
            </div>
          </div>
        </div>

        <h1
          className={`text-3xl font-bold flex flex-row gap-2  mb-6 ${Style["almarai-bold"]}`}
        >
          فاتورة
          <h1 className="text-red-900">
            {" "}
            {cv?.arrivals[0]?.InternalmusanedContract
              ? cv?.arrivals[0]?.InternalmusanedContract
              : null}
          </h1>
        </h1>

        {/* Current Invoice Data Section (non-editable initially) */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">تفاصيل</h2>
          {/* Company and Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold">اسم العميل</label>
              <div className="w-full p-3 border-gray-300 rounded-lg bg-gray-100">
                <span>{cv?.ClientName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">اسم المكتب</label>
              <div className="w-full p-3 border-gray-300 rounded-lg bg-gray-100">
                <span>{cv?.HomeMaid?.officeName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold">صافي الربح</label>
              <div className="w-full p-3 border-gray-300 rounded-lg bg-gray-100">
                <span>
                  {data[data.length - 1]?.remaining_balance
                    ? data[data.length - 1]?.remaining_balance
                    : null}
                </span>
              </div>
            </div>
          </div>

          {/* Modal for no data */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-semibold mb-4">
                  لا توجد فاتورة حالياً
                </h2>
                <p>هل ترغب في إنشاء واحدة؟</p>
                <div className="mt-4">
                  <button
                    onClick={handleCreateInvoice}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                  >
                    نعم، أنشئ فاتورة
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg ml-4"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* المدين والدائن */}
        {isSwitchOn ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">مدين ودائن</h2>
            <table className="w-full table-auto  border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2  text-center border">مدين</th>
                  <th className="px-4 py-2 text-center border">دائن</th>
                  <th className="px-4 py-2  text-centerborder">البيان</th>
                  <th className="px-4 py-2  text-centerborder">الرصيد</th>
                  <th className="px-4 py-2  text-centerborder">التاريخ</th>

                  <th className="px-4 py-2  text-centerborder">اضافة</th>

                  <th className="px-4 py-2 text-center border">حذف</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr className="odd:bg-gray-50">
                    <td className="px-4 py-2  text-center">
                      <h1 className="w-full p-2  rounded-lg">
                        {item?.transaction_type == "creditor"
                          ? item?.amount
                          : null}
                      </h1>
                    </td>
                    <td className="px-4 py-2 ">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.transaction_type == "debtor"
                          ? item?.amount
                          : null}
                      </h1>
                    </td>
                    {/* <td className="px-4 py-2 border">
                    <h1 className="w-full p-2 border rounded-lg">
                      {item?.transaction_type == "debtor" ? null : item?.amount}
                    </h1>
                  </td> */}
                    <td className="px-4 text-center py-2 ">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.Details}
                      </h1>
                    </td>

                    <td className="px-4 text-center py-2 ">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.remaining_balance}
                      </h1>
                    </td>
                    <td className="px-4 py-2  text-center">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.transaction_date
                          ? getDate(item?.transaction_date)
                          : null}
                      </h1>
                    </td>

                    <td className="px-4 text-center py-2 border ">
                      <button
                        type="button"
                        onClick={() => handleUpdateInvoice(item)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                      >
                        تعديل
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded-lg"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="odd:bg-gray-50">
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      value={newCreditAmount}
                      onChange={(e) => onChangeCreditor(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder=""
                    />
                  </td>
                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      value={newDebitAmount}
                      onChange={(e) => onChangeDebtor(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder=""
                    />
                  </td>
                  <td>
                    <div>
                      <Autocomplete
                        onChange={(event, newValue) => {
                          setNewDetails(newValue);
                        }}
                        // onChange={(e) => alert(e.target.value)}
                        options={da}
                        sx={{ width: 300 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            // onChange={(e) => setNewDetails(e.target.value)}
                            label="بيان"
                          />
                        )}
                      />
                    </div>
                  </td>
                  {/* <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={newdetails}
                      onChange={(e) => setNewDetails(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="البيان"
                    />
                  </td> */}
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      disabled
                      value="الرصيد يتم  احتسابه تلقائي"
                      // onChange={(e) => setNewDetails(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      // placeholder="البيان"
                    />
                  </td>

                  <td className="px-4 py-2 border">
                    <input
                      type="date"
                      ref={dateRef}
                      // onChange={}
                      className="w-full p-2 border rounded-lg"
                    />
                  </td>

                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      onClick={() => handleCreateInvoice()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                    >
                      تأكيد
                    </button>
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-500 text-white rounded-lg"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">قائمة دخل</h2>
            <table className="w-full table-auto  border-collapse">
              {/* <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2  text-centerborder">ايرادات</th>
                </tr>
              </thead> */}

              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2  text-centerborder">البيان</th>

                  <th className="px-4 py-2  text-center border w-[250px]">
                    ايرادات{" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-gray-50">
                  <td className="px-4 text-center py-2 ">
                    <h1 className="w-full p-2  text-center rounded-lg">
                      الارباح
                    </h1>
                  </td>

                  <td className="px-4 py-2  text-center">
                    <h1 className="w-full p-2  rounded-lg">
                      {data[data.length - 1]?.remaining_balance
                        ? data[data.length - 1]?.remaining_balance
                        : null}
                    </h1>
                  </td>
                </tr>

                <tr className="bg-gray-100 mt-20">
                  <th className="px-4 py-2  text-centerborder">البيان</th>

                  <th className="px-4 py-2  text-center border w-[250px]">
                    مصروفات
                  </th>
                  <th className="px-4 py-2  text-center border w-[250px]">
                    التاريــخ
                  </th>
                  <th className="px-4 py-2  text-center border w-[250px]">
                    اضافة
                  </th>

                  <th className="px-4 py-2  text-center border w-[250px]">
                    حذف
                  </th>
                </tr>
                {incomeData.map((item) => (
                  <tr className="odd:bg-gray-50">
                    <td className="px-4 text-center py-2 ">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.Details}
                      </h1>
                    </td>

                    <td className="px-4 text-center py-2 ">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.amount}
                      </h1>
                    </td>
                    <td className="px-4 py-2  text-center">
                      <h1 className="w-full p-2  text-center rounded-lg">
                        {item?.transaction_date
                          ? getDate(item?.transaction_date)
                          : null}
                      </h1>
                    </td>

                    <td className="px-4 text-center py-2 border ">
                      <button
                        type="button"
                        onClick={() => handleUpdateInvoice(item)}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                      >
                        تعديل
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        type="button"
                        className="px-4 py-2 bg-red-500 text-white rounded-lg"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="odd:bg-gray-50">
                  <td className="px-4 text-center py-2 ">
                    <h1 className="w-full p-2  text-center rounded-lg font-bold">
                      اجمالي المصروفات
                    </h1>
                  </td>

                  <td className="px-4 text-center py-2 ">
                    <h1 className="w-full p-2  text-center rounded-lg">
                      {incomeData[incomeData.length - 1]?.remaining_balance}
                    </h1>
                  </td>
                </tr>

                <tr className="odd:bg-gray-50">
                  <td className="px-4 text-center py-2 ">
                    <h1 className="w-full p-2  text-pink-600 text-center rounded-lg font-bold">
                      الصافي
                    </h1>
                  </td>

                  <td className="px-4 text-center py-2 ">
                    <h1 className="w-full p-2  text-center rounded-lg">
                      {data[data.length - 1]?.remaining_balance -
                        incomeData[incomeData.length - 1]?.remaining_balance}
                    </h1>
                  </td>
                </tr>

                <tr className="odd:bg-gray-50">
                  <td className="px-4 py-2 border">
                    <input
                      type="text"
                      value={inComeDetails}
                      onChange={(e) => onChangeIncomeDetails(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="البيان"
                    />
                  </td>

                  <td className="px-4 py-2 border">
                    <input
                      type="number"
                      value={incomeAmount}
                      onChange={(e) => onChangeIncomeAmount(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder=""
                    />
                  </td>

                  <td className="px-4 py-2 border">
                    <input
                      type="date"
                      ref={inComedateRef}
                      // onChange={}
                      className="w-full p-2 border rounded-lg"
                    />
                  </td>

                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      onClick={() => handleCreateIncome()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                    >
                      تأكيد
                    </button>
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      className="px-4 py-2 bg-red-500 text-white rounded-lg"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {isEditModalOpen && selectedInvoice && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-semibold mb-4">تعديل الفاتورة</h2>

              <label className="block text-sm font-semibold">نوع العملية</label>
              <select
                onChange={(e) =>
                  setSelectedInvoice({
                    ...selectedInvoice,
                    transaction_type: e.target.value,
                  })
                }
                value={selectedInvoice.transaction_type}
                className="rounded-md"
                name="externalOfficeStatus"
                id="externalOfficeStatus"
              >
                <option value="">...</option>

                <option value="creditor">مدين</option>
                <option value="debtor">دائن</option>
              </select>
              <label className="block text-sm font-semibold">البيان</label>
              <input
                type="text"
                value={selectedInvoice.Details}
                onChange={(e) =>
                  setSelectedInvoice({
                    ...selectedInvoice,
                    Details: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg mb-4"
              />

              <label className="block text-sm font-semibold">المبلغ</label>
              <input
                type="number"
                value={selectedInvoice.amount}
                onChange={(e) =>
                  setSelectedInvoice({
                    ...selectedInvoice,
                    amount: e.target.value,
                  })
                }
                className="w-full p-2 border rounded-lg mb-4"
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    // Call update logic here
                    handleUpdateSubmit();
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg"
                >
                  تحديث
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg ml-4"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
