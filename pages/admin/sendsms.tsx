import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import * as XLSX from "xlsx"; // Import the XLSX library

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loaderRef = useRef(null);
  const [pagesCount, setPagesCount] = useState(1);
  // Function to fetch data (mock API call)
  const fetchData = async (page) => {
    // if (page > pagesCount) return;
    // if (pagesCount == page) setLoading(false);
    try {
      const response = await axios.get(`/api/neworderlistprisma/` + page);
      setPagesCount(response.data.count);
      setData((prevData) => [...prevData, ...response.data.data]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchData(page);
  }, [page]);

  // IntersectionObserver to trigger next page load when the loader appears
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [loading]);
  const router = useRouter();

  // Navigate to the new order (reservation) form
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  // Navigate to the new reservation form (without an ID)
  const handleAddNewReservation = () => {
    router.push("/admin/neworder");
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Excel export function - Only select specific columns to export
  const exportToExcel = () => {
    // Create a filtered data array with only selected columns
    const filteredData = data.map((row) => ({
      ClientName: row.ClientName, // Exporting Client Name
      PhoneNumber: row.PhoneNumber, // Exporting Phone
      Religion: row.Religion, // Exporting Religion
      ExperienceYears: row.ExperienceYears, // Exporting Experience
    }));

    // Create a worksheet from the filtered data
    const ws = XLSX.utils.json_to_sheet(filteredData);

    // Create a new workbook with the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "New Reservations");

    // Export the workbook to Excel format
    XLSX.writeFile(wb, "new_reservations.xlsx");
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        {/* <h1 className="text-3xl font-bold mb-4">
        Infinite Scroll with Next.js and Tailwind
      </h1> */}

        {/* Data display */}
        <div className="space-y-4">
          <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-4">
              <p className="text-2xl font-bold text-cool-gray-700">
                حجوزات جديدة
              </p>
              <div className="flex space-x-4">
                {/* Button to add a new reservation */}
                <button
                  onClick={handleAddNewReservation}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-400"
                >
                  Add New Reservation
                </button>

                {/* Excel Export Button */}
                <button
                  onClick={exportToExcel}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Export to Excel
                </button>
              </div>
            </div>

            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Religion</th>
                  <th className="px-4 py-2">Experience</th>
                  <th className="px-4 py-2">Age</th>
                  <th className="px-4 py-2">Update</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="px-4 py-2 text-lg">{row.id}</td>
                    <td className="px-4 py-2">{row.ClientName}</td>
                    <td className="px-4 py-2">{row.PhoneNumber}</td>
                    <td className="px-4 py-2">{row.Religion}</td>
                    <td className="px-4 py-2">{row.ExperienceYears}</td>
                    <td className="px-4 py-2">{row.age}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleUpdate(row.id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* <div className="flex justify-center items-center p-4 space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-200 transition duration-300 ${
                      currentPage === page
                        ? "bg-purple-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>  */}
          </div>

          {/* Loader */}
          <div ref={loaderRef} className="text-center">
            {loading ? (
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-transparent border-gray-800 rounded-full"></div>
            ) : (
              <p className="text-gray-500">No more posts to load</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
