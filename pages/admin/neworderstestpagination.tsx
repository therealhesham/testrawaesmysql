import Layout from "example/containers/Layout";
import { useEffect, useState } from "react";

export default function Table() {
  const handleUpdate = (id) => {
    // Trigger the update function passed from parent
    onUpdate(id);
  };

  const [data, setData] = useState([]); // Store the data for the current page
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages based on your data
  const itemsPerPage = 5; // Adjust this to your preferred items per page

  // Function to handle pagination change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Slice the data for the current page
  // const getPaginatedData = () => {
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   const endIndex = startIndex + itemsPerPage;
  //   return data.slice(startIndex, endIndex);
  // };

  const fetchData = async (page) => {
    const res = await fetch(`/api/neworderlistprisma/` + page);
    const result = await res.json();
    console.log(result);
    setData(result.data);
    setTotalPages(Math.ceil(result.count / 10));
  };

  // Effect hook to simulate fetching data (use your existing data fetching method)
  useEffect(() => {
    // For now, we're simulating data being fetched
    // You can replace this with your actual data fetching logic
    fetchData(currentPage);
    // setData(fetchedData);
    // setTotalPages(Math.ceil(fetchedData.length / itemsPerPage)); // Calculate the total pages
  }, [currentPage]); // Empty dependency array ensures this runs once when the component is mounted

  return (
    <Layout>
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <p className="text-2xl font-bold text-cool-gray-700">
            New Reservations
          </p>
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
                    className="bg-teal-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center items-center p-4 space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-200 transition duration-300 ${
                  currentPage === page ? "bg-blue-500 text-white" : "bg-white"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
