import { useState, useEffect } from "react";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { useRouter } from "next/router"; // استيراد useRouter
import { ChevronLeftIcon } from "@heroicons/react/solid"; // استيراد أيقونة الرجوع
import { Button } from "@mui/material";
const CheckInTable = () => {
  const router = useRouter(); // تعريف useRouter

  const [checkInData, setCheckInData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const rowsPerPage = 10;

  function getDayOfWeek(date) {
    const daysOfWeek = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const dateObject = new Date(date);
    const dayOfWeek = dateObject.getDay();
    return daysOfWeek[dayOfWeek];
  }

  function getDate(date) {
    const currentDate = new Date(date);
    const form = currentDate.toISOString().split("T")[0];
    return form;
  }

  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchCheckInData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/checkins?page=${currentPage}&limit=${rowsPerPage}&name=${searchQuery}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch check-in data");
        }
        const { data, totalPages } = await response.json();
        setCheckInData(data);
        setTotalPages(totalPages);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCheckInData();
  }, [currentPage, date]);

  const handleSearch = () => {
    setCurrentPage(1);
    setDate(new Date());
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const calculateTotalCost = () => {
    return checkInData.reduce((total, row) => {
      return (
        total +
        (row.breakfastCost || 0) +
        (row.lunchCost || 0) +
        (row.supperCost || 0) +
        (row.cost || 0)
      );
    }, 0);
  };

  const handleBack = () => {
    router.back(); // العودة إلى الصفحة السابقة
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  const totalCost = calculateTotalCost();

  return (
    <Layout>
      <div className="container mx-auto p-4">
        {/* زر الرجوع مع الأيقونة */}
        <button
          onClick={handleBack}
          className="flex items-center px-4 py-2  bg-gray-500 text-white rounded hover:bg-gray-600 mb-4"
        >
          <ChevronLeftIcon className="w-5 h-5 mr-2" /> {/* أيقونة الرجوع */}
          رجوع
        </button>
        <div
          id="hesham"
          style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
        >
          <Button
            style={{ marginLeft: "10px" }}
            variant="contained"
            color="secondary"
            onClick={() => router.push("/admin/workersstatus")}
          >
            حالات العاملات
          </Button>
          <Button
            style={{ marginLeft: "10px" }}
            variant="contained"
            color="warning"
            onClick={() => router.push("/admin/housedarrivals")}
          >
            جدول التسكين
          </Button>
          {/* <Button
    variant="contained"
    color="primary"
    onClick={() => router.push("/admin/checklisttable")}
  >
    بيانات الاعاشة
  </Button> */}
        </div>
        {/* Search Input and Button */}
        <div className="mb-4 flex items-center ">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم..."
            className="p-2 border rounded"
          />
          <button
            onClick={handleSearch}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            بحث
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <h1
            className={`text-left font-medium text-2xl ${Style["almarai-bold"]}`}
          >
            بيانات الاعاشة
          </h1>
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  اسم العاملة
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الافطار
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  تكلفة الافطار
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الغداء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  تكلفة الغداء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  العشاء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  تكلفة العشاء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  حالة الاعاشة
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الاجمالي
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  التاريخ
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  اليوم
                </th>
              </tr>
            </thead>
            <tbody>
              {checkInData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td
                    className="text-center cursor-pointer text-purple-900 text-lg mb-4"
                    onClick={() => {
                      const url = "/admin/cvdetails/" + row.HousedWorker?.id;
                      window.open(url, "_blank");
                    }}
                  >
                    {row.HousedWorker?.Order?.Name}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.breakfastOption || ""}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.breakfastCost || ""}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.lunchOption || ""}
                  </td>
                  <td className="py-2 px-4 border-b">{row.lunchCost || ""}</td>
                  <td className="py-2 px-4 border-b">
                    {row.supperOption || ""}
                  </td>
                  <td className="py-2 px-4 border-b">{row.supperCost || ""}</td>
                  <td className="py-2 px-4 border-b">
                    <span
                      className={
                        row.isActive
                          ? "text-green-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {row.isActive ? "مستمرة" : "انتهت"}
                    </span>
                  </td>

                  <td className="py-2 px-4 border-b">
                    {(row.breakfastCost || 0) +
                      (row.lunchCost || 0) +
                      (row.supperCost || 0)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {getDate(row.CheckDate)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {getDayOfWeek(getDate(row.CheckDate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 bg-blue-500 text-white rounded ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 bg-blue-500 text-white rounded ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CheckInTable;
