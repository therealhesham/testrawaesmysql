import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";

export default function Table() {
  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  const [data, setData] = useState([]); // Store the data for the current page
  const [filteredData, setFilteredData] = useState([]); // Store filtered data based on search
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages based on your data
  const [loading, setLoading] = useState(false); // Loading state
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering
  const itemsPerPage = 5; // Adjust this to your preferred items per page
  const loaderRef = useRef(null); // Reference to the "loading" element at the bottom of the page

  // Fetch data based on the current page
  const fetchData = async (page) => {
    if (loading) return; // Prevent multiple fetches
    setLoading(true); // Start loading
    const res = await fetch(`/api/currentorders/` + page);
    const result = await res.json();
    console.log(result);

    // Ensure result.data is an array before setting it
    const fetchedData = result.data || []; // Fallback to an empty array if undefined or null
    setData((prevData) => [...prevData, ...fetchedData]); // Append new data
    setTotalPages(Math.ceil(result.count / itemsPerPage));
    setLoading(false); // End loading
  };

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages && !loading) {
          setCurrentPage((prevPage) => prevPage + 1); // Load next page when scrolled to the bottom
        }
      },
      {
        rootMargin: "100px", // Trigger when 100px is visible from the bottom of the page
        threshold: 1.0, // Trigger when the entire loading element is visible
      }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current); // Observe the loading element
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current); // Clean up observer when component unmounts
      }
    };
  }, [currentPage, totalPages, loading]);

  // Effect hook to fetch data when the page changes
  useEffect(() => {
    fetchData(currentPage); // Fetch data when component mounts or page changes
  }, [currentPage]);

  // Filter data based on the search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data); // If search is empty, show all data
    } else {
      setFilteredData(
        data.filter((row) =>
          Object.values(row)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, data]); // Run whenever searchQuery or data changes

  return (
    <Layout>
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <div className="flex items-center justify-center">
          <p className="text-2xl font-bold text-cool-gray-700">حجوزات حالية</p>
        </div>

        {/* Search Box */}
        <div className="p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث"
            className="border border-gray-300 p-2 rounded w-full"
          />
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
              <th className="px-4 py-2">Follow up</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="px-4 py-2 text-lg">{row.id}</td>
                <td className="px-4 py-2 text-xl">{row.ClientName}</td>
                <td className="px-4 py-2">{row.PhoneNumber}</td>
                <td className="px-4 py-2">{row.Religion}</td>
                <td className="px-4 py-2">{row.ExperienceYears}</td>
                <td className="px-4 py-2">{row.age}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleUpdate(row.id)}
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
                  >
                    Follow Up
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Loading Spinner (this will be observed for triggering next data load) */}
        {loading && (
          <div className="flex justify-center p-4">
            <span className="loader"></span> {/* Replace with your spinner */}
            Loading...
          </div>
        )}

        {/* The "loader" element that Intersection Observer watches */}
        <div ref={loaderRef} className="h-10" />
      </div>
    </Layout>
  );
}
