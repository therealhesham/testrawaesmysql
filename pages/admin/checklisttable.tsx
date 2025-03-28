import { useState, useEffect } from "react";
import Layout from "example/containers/Layout";
import Style from "styles/Home.module.css";

const CheckInTable = () => {
  const [checkInData, setCheckInData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // Total pages from API
  const rowsPerPage = 3; // Number of rows per page (limit)

  useEffect(() => {
    const fetchCheckInData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/checkins?page=${currentPage}&limit=${rowsPerPage}`
        ); // Pass page and limit as query params
        if (!response.ok) {
          throw new Error("Failed to fetch check-in data");
        }
        const { data, totalPages } = await response.json(); // Expecting { data: [], totalPages: number }
        setCheckInData(data);
        setTotalPages(totalPages); // Update total pages from API
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCheckInData();
  }, [currentPage]); // Refetch when currentPage changes

  // Handle page navigation
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Render loading, error, or table
  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }
  return (
    <Layout>
      <div className="container mx-auto p-4">
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
                  ID
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الاسم
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الافطار
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الغداء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  العشاء
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  الشكوى
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  تكلفة
                </th>
                <th className="py-2 px-4 border-b text-left text-gray-600">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {checkInData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{row.id}</td>
                  <td className="py-2 px-4 border-b">
                    {row.HousedWorker?.Order.HomeMaid?.Name}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.breakfastOption || "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.lunchOption || "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.supperOption || "N/A"}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {row.complaint || "None"}
                  </td>
                  <td className="py-2 px-4 border-b">{row.cost || "None"}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(row.createdAt).toLocaleString()}
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
