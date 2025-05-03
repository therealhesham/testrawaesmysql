import EditCashModal from "components/editcashmodal";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import {
  Button,
  Modal,
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

import { useState, useEffect } from "react";

export default function CashTable() {
  const [cashError, setCashError] = useState("");

  const [cashData, setCashData] = useState([]);
  const [selectedCash, setSelectedCash] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cashToDelete, setCashToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
const [openCashModal, setOpenCashModal] = useState(false);
  const [newCashRecord, setNewCashRecord] = useState({
    amount: "",
    transaction_type: "",
    Year: "",
    Month: "",
  });
  // Function to convert month number to Arabic month name
  const getArabicMonthName = (monthNumber) => {
    const monthNames = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر"
    ];
    return monthNames[parseInt(monthNumber) - 1] || monthNumber;
  };

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
    setIsEditModalOpen(true);
  };

  const handleModalSave = (updatedCash) => {
    setCashData((prev) =>
      prev.map((item) => (item.id === updatedCash.id ? updatedCash : item))
    );
  };

  const openDeleteModal = (cash) => {
    setCashToDelete(cash);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCashToDelete(null);
  };

  const deleteCash = async () => {
    if (!cashToDelete) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/addcash?id=${cashToDelete.id}`, {
        method: "DELETE",
      });

      if (res.status === 204) {
        setCashData((prev) => prev.filter((item) => item.id !== cashToDelete.id));
      } else {
        const errorData = await res.json();
        console.error(`فشل في حذف السجل: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting cash record:", error);
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };
    const handleOpenCashModal = () => {
    setOpenCashModal(true);
  };

  const handleCloseCashModal = () => {
    setOpenCashModal(false);
    setNewCashRecord({
      amount: "",
      transaction_type: "",
      Year: "",
      Month: "",
    });
    setCashError("");
  };

  const handleCashRecordChange = (e) => {
    const { name, value } = e.target;
    setNewCashRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCashRecord = async () => {
    try {
      const response = await fetch("/api/addcash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: newCashRecord.amount,
          transaction_type: newCashRecord.transaction_type,
          Month: newCashRecord.Month,
          Year: newCashRecord.Year.toString(),
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        handleCloseCashModal();
        // إعادة تحميل البيانات إذا لزم الأمر
        fetchData();
      } else {
        setCashError(data.error || "فشل في إضافة السجل النقدي");
      }
    } catch (error) {
      setCashError("خطأ في الاتصال بالخادم");
    }
  };


  return (
    <Layout>
      <div className="overflow-x-auto mt-6">
<Button
              style={{ marginLeft: "20px",marginTop: "20px" }}
              variant="contained"
              color="success"
              onClick={handleOpenCashModal}
               className={` ${Style["almarai-bold"]}`}
            >
              إدارة النقد
            </Button>
     
        <h1
          className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}
        >
          قائمة الكاش
        </h1>
<div >
            </div>
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
          <thead>
            <tr className="bg-yellow-400 text-white text-center">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">القيمة</th>
              <th className="py-3 px-4">الشهر</th>
              <th className="py-3 px-4">السنة</th>
              <th className="py-3 px-4">المصروف</th>
              <th className="py-3 px-4">المتبقي</th>
              <th className="py-3 px-4">تعديل</th>
              <th className="py-3 px-4">حذف</th>
            </tr>
          </thead>
          <tbody>
            {cashData.map((cash, index) => (
              <tr
                key={cash.id}
                className="border-t border-gray-100 hover:bg-gray-50 text-center"
              >
                <td className="py-2 px-4">{index + 1}</td>
                <td className="py-2 px-4">{cash.amount} ر.س</td>
                <td className="py-2 px-4">{getArabicMonthName(cash.Month)}</td>
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
                <td className="py-2 px-4">
                  <button
                    onClick={() => openDeleteModal(cash)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Edit Modal */}
        <EditCashModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          cashData={selectedCash || {}}
          onSave={handleModalSave}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4 text-right">
                تأكيد الحذف
              </h2>
              <p className="mb-6 text-right">
                هل أنت متأكد من حذف سجل الكاش لشهر{" "}
                {cashToDelete && getArabicMonthName(cashToDelete.Month)} سنة{" "}
                {cashToDelete && cashToDelete.Year}؟
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={closeDeleteModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  disabled={isLoading}
                >
                  إلغاء
                </button>
                <button
                  onClick={deleteCash}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      جاري الحذف...
                    </>
                  ) : (
                    "حذف"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
         <Modal open={openCashModal} onClose={handleCloseCashModal}>
           <Box
             sx={{
               position: "absolute",
               top: "50%",
               left: "50%",
               transform: "translate(-50%, -50%)",
               width: 600,
               maxHeight: "80vh",
               bgcolor: "background.paper",
               boxShadow: 24,
               p: 4,
               borderRadius: 2,
               overflowY: "auto",
             }}
           >
             <h2 className={Style["almarai-bold"]}>إضافة سجل نقدي</h2>
 
             <TextField
               fullWidth
               label="المبلغ"
               name="amount"
               type="number"
               value={newCashRecord.amount}
               onChange={handleCashRecordChange}
               margin="normal"
               required
             />
             {/* 
             <FormControl fullWidth margin="normal">
               <InputLabel>نوع العملية</InputLabel>
               <Select
                 name="transaction_type"
                 value={newCashRecord.transaction_type}
                 onChange={handleCashRecordChange}
                 required
               >
                 <MenuItem value="income">إيراد</MenuItem>
                 <MenuItem value="expense">مصروف</MenuItem>
               </Select>
             </FormControl> */}
 
             <FormControl fullWidth margin="normal">
               <InputLabel>الشهر</InputLabel>
               <Select
                 name="Month"
                 value={newCashRecord.Month}
                 onChange={handleCashRecordChange}
                 required
               >
                 <MenuItem value="1">يناير</MenuItem>
                 <MenuItem value="2">فبراير</MenuItem>
                 <MenuItem value="3">مارس</MenuItem>
                 <MenuItem value="4">أبريل</MenuItem>
                 <MenuItem value="5">مايو</MenuItem>
                 <MenuItem value="6">يونيو</MenuItem>
                 <MenuItem value="7">يوليو</MenuItem>
                 <MenuItem value="8">أغسطس</MenuItem>
                 <MenuItem value="9">سبتمبر</MenuItem>
                 <MenuItem value="10">أكتوبر</MenuItem>
                 <MenuItem value="11">نوفمبر</MenuItem>
                 <MenuItem value="12">ديسمبر</MenuItem>
               </Select>
             </FormControl>
 
             <FormControl fullWidth margin="normal">
               <InputLabel>السنة</InputLabel>
               <Select
                 name="Year"
                 value={newCashRecord.Year}
                 onChange={handleCashRecordChange}
                 required
               >
                 {[...Array(6)].map((_, index) => {
                   const year = new Date().getFullYear() - 3 + index;
                   return (
                     <MenuItem key={year} value={year}>
                       {year}
                     </MenuItem>
                   );
                 })}
               </Select>
             </FormControl>
 
             {cashError && (
               <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                 {cashError}
               </Typography>
             )}
 
             <Box mt={2} display="flex" justifyContent="space-between">
               <Button
                 variant="contained"
                 color="primary"
                 onClick={handleSaveCashRecord}
               >
                 حفظ
               </Button>
               <Button
                 variant="outlined"
                 color="secondary"
                 onClick={handleCloseCashModal}
               >
                 إلغاء
               </Button>
             </Box>
           </Box>
         </Modal>

      </div>
 
    </Layout>
  );
}