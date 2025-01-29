import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "react-bootstrap";

export default function Table() {
  const [filters, setFilters] = useState({
    ClientName: "",
    age: "",
    Passportnumber: "",
    Nationality: "",
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
      // Build the query string for filters
      const queryParams = new URLSearchParams({
        ClientName: filters.ClientName,
        age: filters.age,
        Nationality: filters.Nationality,
        page: String(pageRef.current),
      });

      const response = await fetch(`/api/currentordersprisma?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const res = await response.json();
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

      return () => observer.disconnect();
    },
    [loading, hasMore]
  );

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
    isFetchingRef.current = false;
    setHasMore(true);
    // alert(filters.Name);
    setData([]);
    pageRef.current = 1;
    fetchData();
  };
  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold text-center mb-4">
          الحجوزات الحالية
        </h1>

        {/* Filter Section */}
        <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.ClientName}
              onChange={(e) => handleFilterChange(e, "ClientName")}
              placeholder="Filter by Name"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passportnumber}
              onChange={(e) => handleFilterChange(e, "Passportnumber")}
              placeholder="Filter by Passport"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Nationality}
              onChange={(e) => handleFilterChange(e, "Nationality")}
              placeholder="Filter by Nationality"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 text-left text-sm font-medium">م</th>
              <th className="p-3 text-left text-sm font-medium">الاسم</th>
              <th className="p-3 text-left text-sm font-medium">العمر</th>
              <th className="p-3 text-left text-sm font-medium">
                رقم جواز السفر
              </th>
              <th className="p-3 text-left text-sm font-medium">رقم العاملة</th>

              <th className="p-3 text-left text-sm font-medium">الجنسية</th>
              <th className="p-3 text-left text-sm font-medium">تحديث</th>

              {/* <th className="p-3 text-left text-sm font-medium">Role</th> */}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="p-3 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 text-md text-gray-600">{item.id}</td>
                  <td className="p-3 text-md text-gray-600">
                    {item.ClientName}
                  </td>
                  <td className="p-3 text-md text-gray-700">
                    {item.clientphonenumber}
                  </td>
                  <td className="p-3 text-md text-gray-700">
                    {item.Passportnumber}
                  </td>

                  <td className="p-3 text-md text-gray-700">
                    {item.HomemaidId}
                  </td>

                  <td className="p-3 text-md text-gray-700">
                    {item.Nationality}
                  </td>
                  <td className="p-3 text-md text-gray-700">
                    <Button onClick={() => handleUpdate(item.id)}>تحديث</Button>
                  </td>

                  {/* <td className="p-3 text-sm text-gray-600">{item.role}</td> */}
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
