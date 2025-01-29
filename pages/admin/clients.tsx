// components/ClientsTable.js
import Layout from "example/containers/Layout";
import React, { useEffect, useState } from "react";
// Layout
// useState
const ClientsTable = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Function to detect when the user reaches the bottom
  const handleScroll = () => {
    // Get the current scroll position and the total height of the document
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // If the scroll position is near the bottom (allow some margin)
    if (scrollPosition >= documentHeight - 100) {
      setIsAtBottom(true); // Set state to true when reaching near the bottom
      setPage((e) => e + 1);
    } else {
      setIsAtBottom(false); // Reset state if not at the bottom
    }
  };

  // Attach the scroll event listener on mount
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const queryParams = new URLSearchParams({
    page,
  });

  const fetchData = async () => {
    // alert("s");
    const response = await fetch("/api/clients?" + queryParams, {
      method: "get",
    });
    const data = await response.json();
    setData(data);
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // useEffect(()=>{

  //       const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       if (entry.isIntersecting && loading) {
  //         setPage((prevPage) => prevPage + 1);
  //       }
  //     },
  //     { threshold: 1.0 }
  //   );

  //   const currentLoaderRef = loaderRef.current;
  //   if (currentLoaderRef) {
  //     observer.observe(currentLoaderRef);
  //   }

  //   // Cleanup observer when component unmounts or loaderRef changes
  //   return () => {
  //     if (currentLoaderRef) {
  //       observer.unobserve(currentLoaderRef);
  //     }
  //   };

  // },[])
  return (
    <Layout>
      <div className="overflow-x-auto shadow-lg rounded-lg bg-white">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-4 text-left">م</th>
              <th className="px-6 py-4 text-left">الاسم</th>
              <th className="px-6 py-4 text-left">الريد الالكتروني</th>
              <th className="px-6 py-4 text-left">الجوال</th>
              <th className="px-6 py-4 text-left">عدد الطلبات</th>

              <th className="px-6 py-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((client, index) => (
              <tr
                key={client.id}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                } hover:bg-gray-200 transition-colors duration-200`}
              >
                <td className="px-6 py-4">{client.id}</td>
                <td className="px-6 py-4">{client.fullname}</td>
                <td className="px-6 py-4">{client.email}</td>
                <td className="px-6 py-4">{client.phonenumber}</td>
                <th className="px-6 py-4 text-left">{client._count.orders}</th>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      client.status === "active"
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAtBottom && (
          <div className="fixed bottom-0 left-0 w-full bg-green-500 text-white py-2 text-center">
            You have reached the end of the page!
          </div>
        )}
      </div>
    </Layout>
  );
};
export default ClientsTable;
