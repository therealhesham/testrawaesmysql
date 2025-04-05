import { useState, useEffect } from "react";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";
import { set } from "mongoose";

const CheckInTable = () => {
  const [checkInData, setCheckInData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Total pages from API
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const rowsPerPage = 10; // Number of rows per page (limit)

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
    const dayOfWeek = dateObject.getDay(); // الحصول على اليوم من 0 إلى 6
    return daysOfWeek[dayOfWeek]; // إرجاع اليوم بالاسم باللغة العربية
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
          `/api/checkins?page=${currentPage}&limit=${rowsPerPage}&name=${searchQuery}` // Pass page and limit as query params
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
    setCurrentPage(1); // Reset to the first page when searching

    setDate(new Date()); // Reset date to current date when searching
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
                  الشكوى
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
                <tr key={row.id} className="hover:bg-gray-50 ">
                  <td
                    className={`text-center cursor-pointer text-purple-900 text-lg mb-4 `}
                    onClick={() => {
                      const url =
                        "/admin/cvdetails/" +
                        row.HousedWorker?.Order.HomeMaid.id;
                      window.open(url, "_blank");
                    }}
                  >
                    {row.HousedWorker?.Order.HomeMaid?.Name}
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
                    {row.complaint || "None"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {(row.breakfastCost || 0) +
                      (row.lunchCost || 0) +
                      (row.supperCost || 0)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {getDate(row.createdAt)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {getDayOfWeek(getDate(row.createdAt))}
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
