import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import jwt from "jsonwebtoken";
import { Button } from "@mui/material";
import Style from "styles/Home.module.css";

export default function Table() {
  const [filters, setFilters] = useState({
    SponsorName: "",
    age: "",
    PassportNumber: "",
    OrderId: "",
  });

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }
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
        SponsorName: filters.SponsorName,
        age: filters.age,
        OrderId: filters.OrderId,
        PassportNumber: filters.PassportNumber,
        // Nationalitycopy: filters.Nationality,
        page: String(pageRef.current),
      });

      const response = await fetch(`/api/deparatures?${queryParams}`, {
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

  const makeRequest = async (url: string, body: object) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return response.status === 200;
  };

  const restore = async (id: string, homeMaidId: string) => {
    const success = await makeRequest("/api/restoreorders", {
      id,
      homeMaidId,
    });
    if (success) router.push("/admin/neworders");
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

  // useEffect to fetch the first page of data on mount
  useEffect(() => {
    fetchData(); // Fetch the first page of data
  }, []); // Only run once on mount

  // useEffect to fetch data when filters change
  // useEffect(() => {
  //   // Reset page and data on filter change
  //   pageRef.current = 1;
  //   setData([]);
  //   setHasMore(true);
  //   fetchData();
  // }, [filters]); // Only re-run when filters change

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

  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1
          className={`text-left font-medium text-2xl mb-4 ${Style["almarai-bold"]}`}
        >
          قائمة المغادرة
        </h1>

        {/* Filter Section */}
        <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.SponsorName}
              onChange={(e) => handleFilterChange(e, "SponsorName")}
              placeholder="بحث باسم الكفيل"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.PassportNumber}
              onChange={(e) => handleFilterChange(e, "PassportNumber")}
              placeholder="بحث برقم الجواز"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.OrderId}
              onChange={(e) => handleFilterChange(e, "OrderId")}
              placeholder="بحث برقم الكفيل"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9]  bg-[#3D4C73]  text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setFilters({
                  age: "",
                  OrderId: "",
                  PassportNumber: "",
                  SponsorName: "",
                });
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>اعادة ضبط</h1>
            </button>
          </div>
          <div className="flex-1 px-1">
            <button
              className={
                "text-[#EFF7F9]  bg-[#3D4C73]  text-lg py-2 px-4 rounded-md transition-all duration-300"
              }
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-bold"]}>بحث</h1>
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-yellow-400 text-white">
              <th className="p-3 text-left text-sm font-medium">م</th>
              <th className="p-3 text-left text-sm font-medium">اسم الكفيل</th>
              <th className="p-3 text-left text-sm font-medium">جوال العميل</th>
              <th className="p-3 text-left text-sm font-medium">
                رقم جواز السفر
              </th>
              <th className="p-3 text-left text-sm font-medium">الطلب</th>
              <th className="p-3 text-left text-sm font-medium">
                تاريخ المغادرة
              </th>
              <th className="p-3 text-left text-sm font-medium">
                وقت المغادرة
              </th>
              {/* 
              <th className="p-3 text-left text-sm font-medium">الجنسية</th>
              <th className="p-3 text-left text-sm font-medium">استعادة</th> */}
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
                    {item.SponsorName}
                  </td>
                  <td className="p-3 text-md text-gray-700">
                    {item.SponsorPhoneNumber}
                  </td>
                  <td className="p-3 text-md text-gray-700">
                    {item.PassportNumber}
                  </td>

                  <td className="p-3 text-md text-gray-700">{item.OrderId}</td>

                  <td className="p-3 text-md text-gray-700">
                    {getDate(item.deparatureDate)}
                  </td>

                  <td className="p-3 text-md text-gray-700">
                    {item.deparatureTime}
                  </td>

                  {/* <td className="p-3 text-md text-gray-700">
                    {item.Nationalitycopy}
                  </td> */}
                  {/* <td className="p-3 text-sm text-gray-600">
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => restore(item.id, item.HomemaidIdCopy)}
                    >
                      استعادة
                    </Button>
                  </td> */}
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
