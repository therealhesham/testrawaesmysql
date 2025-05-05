import EditCashModal from "components/editcashmodal";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import {
  Button,
  Modal,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaUser, FaClock } from 'react-icons/fa'; // استيراد أيقونات إضافية


export default function CashTable() {
  const [cashError, setCashError] = useState("");
  interface CashRecord {
    id?: number;
    amount?: number;
    Month: number;
    Year: number;
    spent?: number;
    remaining?: number;
    transaction_type?: string;
    cashLogs?: { id: number; Status: string; createdAt: string; updatedAt: string; userId: number | null; cashID: number }[];
  }
const statusIcons = {
  'مكتمل': <FaCheckCircle className="text-green-500" />,
  'ملغى': <FaTimesCircle className="text-red-500" />,
  'معلق': <FaInfoCircle className="text-blue-500" />,
  // أضف المزيد من الحالات حسب الحاجة
  'افتراضي': <FaInfoCircle className="text-gray-500" />, // حالة افتراضية
};
  const [cashData, setCashData] = useState<CashRecord[]>([]);
  const [selectedCash, setSelectedCash] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cashToDelete, setCashToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openCashModal, setOpenCashModal] = useState(false);
  const [newCashRecord, setNewCashRecord] = useState({
    amount: "",
    Month: "",
    Year: "",
  });
  const [existingAmount, setExistingAmount] = useState(null);
  const [incrementMonth, setIncrementMonth] = useState(0);
  const [incrementYear, setIncrementYear] = useState(0);
  const [cashAddError, setCashAddError] = useState("");
  const [openCashAddModal, setOpenCashAddModal] = useState(false);
  const [newCashAddRecord, setNewCashAddRecord] = useState({
    amount: "",
    transaction_type: "",
    Year: "",
    Month: "",
  });
  const [openLogsMonth, setOpenLogsMonth] = useState(null); // حالة لتتبع الشهر المفتوح لعرض الـ logs

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const years = useMemo(
    () => Array.from({ length: 3 }, (_, i) => currentYear - 1 + i),
    [currentYear]
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const generateAllMonths = () => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return months.map((month) => ({
      Month: month,
      Year: selectedYear,
    }));
  };

  const mergeDataWithMonths = (fetchedData: CashRecord[]) => {
    const allMonths = generateAllMonths();
    const mergedData = allMonths.map((monthRecord) => {
      const matchingRecord = fetchedData.find(
        (data) =>
          parseInt(data.Month) === monthRecord.Month &&
          data.Year.toString() === monthRecord.Year.toString()
      );
      return matchingRecord || monthRecord;
    });
    return mergedData;
  };

  const isFutureMonth = (month: number) => {
    return selectedYear > currentYear || (selectedYear === currentYear && month > currentMonth);
  };

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
      "ديسمبر",
    ];
    return monthNames[parseInt(monthNumber) - 1] || monthNumber;
  };

  const getAllowedMonths = () => {
    const months = [];
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    months.push({
      month: currentMonth,
      year: currentYear,
      name: getArabicMonthName(currentMonth),
    });

    months.push({
      month: nextMonth,
      year: nextMonthYear,
      name: getArabicMonthName(nextMonth),
    });

    return months;
  };

  const allowedYears = [currentYear];
  if (currentMonth === 12) {
    allowedYears.push(currentYear + 1);
  }

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/addcash?year=${selectedYear}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const mergedData = mergeDataWithMonths(data);
      setCashData(mergedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setCashError("خطأ في جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cash) => {
    setSelectedCash(cash);
    setIsEditModalOpen(true);
  };

  const handleModalSave = (updatedCash) => {//فانكشن تعديل الكاش ..يستعيد السجلات بعد الحفظ
    fetchData(); // Refresh data after saving
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
        setCashData((prev) =>
          prev.map((item) =>
            item.id === cashToDelete.id
              ? { Month: item.Month, Year: item.Year }
              : item
          )
        );
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

  const handleOpenCashModal = (month, year) => {
    setIncrementMonth(month);
    setIncrementYear(year);
    setNewCashRecord({
      ...newCashRecord,
      Month: month.toString(),
      Year: year.toString(),
    });
    setOpenCashModal(true);
  };

  const handleCloseCashModal = () => {
    setOpenCashModal(false);
    setNewCashRecord({
      amount: "",
      Month: "",
      Year: "",
    });
    setExistingAmount(null);
    setCashError("");
  };

  const handleCashRecordChange = (e) => {
    const { name, value } = e.target;
    setNewCashRecord((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkExistingAmount = async () => {
    if (!newCashRecord.Month || !newCashRecord.Year) return;
    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: newCashRecord.Month,
          year: newCashRecord.Year.toString(),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setExistingAmount(data.amount);
      } else {
        setCashError("خطأ في التحقق من المبلغ الحالي");
      }
    } catch (error) {
      setCashError("خطأ في الاتصال بالخادم");
    }
  };

  const handleSaveCashRecord = async () => {
    try {
      const response = await fetch("/api/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: newCashRecord.amount,
          month: incrementMonth,
          year: incrementYear.toString(),
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setCashError("");
        handleCloseCashModal();
        fetchData();
      } else {
        setCashError(data.error || "فشل في إضافة المبلغ");
      }
    } catch (error) {
      setCashError("خطأ في الاتصال بالخادم");
    }
  };

  const handleOpenCashAddModal = () => {
    setOpenCashAddModal(true);
  };

  const handleCloseCashAddModal = () => {
    setOpenCashAddModal(false);
    setNewCashAddRecord({
      amount: "",
      transaction_type: "",
      Year: "",
      Month: "",
    });
    setCashAddError("");
  };

  const handleCashAddRecordChange = (e) => {
    const { name, value } = e.target;
    setNewCashAddRecord((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "Month") {
      const selectedMonth = getAllowedMonths().find(
        (m) => m.month === Number(value)
      );
      if (selectedMonth) {
        setNewCashAddRecord((prev) => ({
          ...prev,
          Year: selectedMonth.year.toString(),
        }));
      }
    }
  };

  const handleSaveCashAddRecord = async () => {
    const selectedMonth = Number(newCashAddRecord.Month);
    const selectedYear = Number(newCashAddRecord.Year);
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    if (
      (selectedYear === currentYear && selectedMonth > currentMonth + 1) ||
      (selectedYear === nextMonthYear && selectedMonth > nextMonth) ||
      selectedYear > nextMonthYear
    ) {
      setCashAddError("لا يمكن إضافة رصيد لشهر يتجاوز الشهر القادم");
      return;
    }

    try {
      const response = await fetch("/api/addcash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: newCashAddRecord.amount,
          transaction_type: newCashAddRecord.transaction_type,
          Month: newCashAddRecord.Month,
          Year: newCashAddRecord.Year.toString(),
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        handleCloseCashAddModal();
        fetchData();
      } else {
        setCashAddError(data.error || "فشل في إضافة السجل النقدي");
      }
    } catch (error) {
      setCashAddError("خطأ في الاتصال بالخادم");
    }
  };

  const toggleLogs = (month, year) => {
    const key = `${month}-${year}`;
    setOpenLogsMonth(openLogsMonth === key ? null : key);
  };

  return (
    <Layout>
      <div className="overflow-x-auto mt-6">
        <Head>
          <title>
سجلات النقد - مشروع الاستقدام
</title>
        </Head>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="contained"
            color="success"
            onClick={handleOpenCashAddModal}
            className={`${Style["almarai-bold"]}`}
          >
            إضافة ميزانية شهر جديد
          </Button>
          <FormControl sx={{ minWidth: 120, marginTop: 3 }}>
            <InputLabel>السنة</InputLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              label="السنة"
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <h1 className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}>
          قائمة الكاش ({selectedYear})
        </h1>
        {isLoading ? (
          <Typography>جاري تحميل البيانات...</Typography>
        ) : cashError ? (
          <Typography color="error">{cashError}</Typography>
        ) : cashData.length === 0 ? (
          <Typography>لا توجد بيانات متاحة</Typography>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-md">
            <thead>
              <tr className="bg-yellow-400 text-white text-center">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">السنة</th>
                <th className="py-3 px-4">الشهر</th>
                <th className="py-3 px-4">القيمة</th>
                <th className="py-3 px-4">المصروف</th>
                <th className="py-3 px-4">المتبقي</th>
                <th className="py-3 px-4" colSpan={3}>
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {cashData.map((cash, index) => {
                const isFuture = isFutureMonth(cash.Month);
                const logsKey = `${cash.Month}-${cash.Year}`;
                const showLogs = openLogsMonth === logsKey;

                return (
                  <>
                    <tr
                      key={`${cash.Year}-${cash.Month}`}
                      className={`border-t border-gray-100 hover:bg-gray-50 text-center ${
                        isFuture ? "text-gray-400" : ""
                      }`}
                    >
                      <td className="py-2 px-4">{index + 1}</td>
                      <td className="py-2 px-4">{cash.Year}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => toggleLogs(cash.Month, cash.Year)}
                          className={`${Style["almarai-bold"]} text-blue-600 hover:underline ${
                            !cash.cashLogs?.length || isFuture
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={!cash.cashLogs?.length || isFuture}
                        >
                          {getArabicMonthName(cash.Month)}
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        {cash.amount ? `${cash.amount} ر.س` : "-"}
                      </td>
                      <td className="py-2 px-4">
                        {cash.spent ? `${cash.spent} ر.س` : "-"}
                      </td>
                      <td className="py-2 px-4">
                        {cash.remaining ? `${cash.remaining} ر.س` : "-"}
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleOpenCashModal(cash.Month, cash.Year)}
                          className={`${Style["almarai-bold"]} bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 ${
                            isFuture ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isFuture}
                        >
                          إضافة مبلغ
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleEdit(cash)}
                          className={`${Style["almarai-bold"]} bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-600 ${
                            !cash.id || isFuture ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={!cash.id || isFuture}
                        >
                          تعديل
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => openDeleteModal(cash)}
                          className={`${Style["almarai-bold"]} bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 ${
                            !cash.id || isFuture ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={!cash.id || isFuture}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
{showLogs && cash.cashLogs?.length > 0 && (
  <tr>
    <td colSpan={9} className="p-4">
      <div className="bg-gray-100 rounded-md p-4 space-y-2 text-sm">
        {cash.cashLogs.map((log) => (
          <div key={log.id} className="flex items-center gap-2">
            {/* أيقونة الحالة */}
            <div className="flex-shrink-0">
              {statusIcons[log.Status] || statusIcons['افتراضي']}
            </div>
            <span className="flex items-center gap-2">
              {/* نص الحالة */}
              <span className="text-blue-600 font-medium">{log.Status}</span>
              {" بواسطة "}
              {/* أيقونة المستخدم */}
              <FaUser className="text-green-600 inline-block" />
              <span className="text-green-600 font-medium">{log.userId || "مستخدم غير معروف"}</span>
              {/* أيقونة الوقت إذا كان هناك timestamp */}
              {log.timestamp && (
                <span className="text-gray-500 flex items-center gap-1">
                  <FaClock className="inline-block" />
                  {new Date(log.timestamp).toLocaleString('ar-EG')}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </td>
  </tr>
)}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        <EditCashModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          cashData={selectedCash || {}}
          onSave={handleModalSave}
        />

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
            <h2 className={Style["almarai-bold"]}>إضافة مبلغ نقدي</h2>

            {existingAmount !== null && (
              <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
                المبلغ الحالي لشهر{" "}
                <span className="text-red-500">{newCashRecord.Month}</span> سنة{" "}
                <span className="text-red-500">{newCashRecord.Year}</span>:{" "}
                <span className={Style["almarai-bold"]}>
                  {existingAmount} ر.س
                </span>
              </Typography>
            )}

            <TextField
              fullWidth
              label="المبلغ"
              name="amount"
              type="number"
              value={newCashRecord.amount}
              onChange={handleCashRecordChange}
              margin="normal"
              required
              inputProps={{ step: "0.01" }}
            />

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
                إضافة
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

        <Modal open={openCashAddModal} onClose={handleCloseCashAddModal}>
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

            <FormControl fullWidth margin="normal">
              <InputLabel>الشهر</InputLabel>
              <Select
                name="Month"
                value={newCashAddRecord.Month}
                onChange={handleCashAddRecordChange}
                required
              >
                <MenuItem value="">اختر الشهر</MenuItem>
                {getAllowedMonths().map((month) => (
                  <MenuItem key={`${month.month}-${month.year}`} value={month.month}>
                    {month.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="المبلغ"
              name="amount"
              type="number"
              value={newCashAddRecord.amount}
              onChange={handleCashAddRecordChange}
              margin="normal"
              required
            />

            {cashAddError && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {cashAddError}
              </Typography>
            )}

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveCashAddRecord}
              >
                حفظ
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseCashAddModal}
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