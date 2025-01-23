//@ts-nocheck
//@ts-ignore
import Layout from "example/containers/Layout";
import { useEffect, useState, useCallback, useRef } from "react";

export default function Table() {
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    Passport: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [hasMore, setHasMore] = useState(true); // To check if there is more data to load

  const pageRef = useRef(1); // Use a ref to keep track of the current page number
  const isFetchingRef = useRef(false); // Ref to track whether data is being fetched

  // Fetch data with pagination
  const fetchData = async () => {
    if (isFetchingRef.current || !hasMore) return; // Prevent duplicate fetches if already loading
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(`/api/homemaidprisma/${pageRef.current}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });
      const res = await response.json();
      console.log(pageRef.current);
      if (res && res.length > 0) {
        setData((prevData) => [...prevData, ...res]); // Append new data
        pageRef.current += 1; // Increment page using ref
      } else {
        setHasMore(false); // No more data to load
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Use a callback to call fetchData when the user reaches the bottom
  const loadMoreRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchData(); // Fetch next page of data
          }
        },
        { threshold: 1.0 }
      );

      if (node) observer.observe(node);

      // Cleanup the observer when the component unmounts
      return () => observer.disconnect();
    },
    [loading, hasMore] // No need to track page here since it's managed by useRef
  );

  // Initialize fetching of the first page when the component mounts
  useEffect(() => {
    fetchData(); // Fetch the first page of data
  }, []); // Only run once on mount

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    column: string
  ) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold text-center mb-4">العاملات</h1>

        {/* Column Filters */}
        {/* <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Name}
              onChange={(e) => handleFilterChange(e)}
              placeholder="Filter by Name"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.age}
              onChange={(e) => handleFilterChange(e, "age")}
              placeholder="Filter by Age"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passport}
              onChange={(e) => handleFilterChange(e, "role")}
              placeholder="Filter by Role"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div> */}

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 text-left text-sm font-medium">ID</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Age</th>
              <th className="p-3 text-left text-sm font-medium">
                Passportnumber
              </th>

              <th className="p-3 text-left text-sm font-medium">Nationality</th>

              <th className="p-3 text-left text-sm font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="p-3 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 text-sm text-gray-600">{item.id}</td>
                  <td className="p-3 text-sm text-gray-600">{item.Name}</td>
                  <td className="p-3 text-sm text-gray-600">{item.age}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {item.Passportnumber}
                  </td>

                  <td className="p-3 text-sm text-gray-600">
                    {item.Nationalitycopy}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{item.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef} // Use IntersectionObserver to trigger load more
            className="flex justify-center mt-6"
          >
            {loading && (
              <div className="flex justify-center items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4V1m0 22v-3m8-6h3m-22 0H4m16.243-7.757l2.121-2.121m-16.97 0L5.757 5.757M12 9v3m0 0v3m0-3h3m-3 0H9"
                  />
                </svg>
                Loading...
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
