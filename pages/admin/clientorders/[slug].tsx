//@ts-nocheck
//@ts-ignore
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
// Layout
// useState
const ClientsTable = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const router = useRouter();
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
    const response = await fetch("/api/clientorders/" + router.query.slug, {
      method: "get",
    });
    const data = await response.json();
    setData(data);
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchData();
  }, [page, router.isReady]);

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
        <h1 className="text-2xl font-semibold text-center mb-4">
          طلبات العميل
        </h1>

        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2">م</th>
              <th className="px-4 py-2">اسم العميل</th>
              <th className="px-4 py-2">جوال العميل</th>
              <th className="px-4 py-2">رقم الخادمة</th>
              {/* <th className="px-4 py-2">ديانة العاملة</th> */}
              <th className="px-4 py-2">الخبرة</th>
              <th className="px-4 py-2">العمر</th>
              <th className="px-4 py-2">موافق</th>
              <th className="px-4 py-2">رفض</th>

              {/* <th className="px-6 py-4 text-left">اخر طلب</th> */}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id}
                className={`${
                  index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                } hover:bg-gray-200 transition-colors duration-200`}
              >
                <td className="px-4 py-2 text-lg">{row.id}</td>
                <td className="px-4 py-2">{row.ClientName}</td>
                <td className="px-4 py-2">{row.clientphonenumber}</td>
                <td
                  onClick={() => router.push("/admin/cvdetails/" + HomemaidId)}
                  className="px-3 py-2 cursor-pointer decoration-black"
                >
                  {row.HomemaidId}
                </td>
                {/* <td className="px-4 py-2">{row.Religion}</td> */}
                <td className="px-4 py-2">{row.ExperienceYears}</td>
                <td className="px-4 py-2">{row.age}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => router.push("/admin/neworder/" + row.id)}
                    className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 active:bg-green-700 transition-all duration-200"
                  >
                    open
                  </button>
                </td>
                <td className="px-4 py-2">
                  {/* <RejectBooking
                        bookingstatus={row.bookingstatus}
                        date={row.createdAt}
                        phone={row.clientphonenumber}
                        reason={reason}
                        name={row.ClientName}
                        id={row.id}
                        setReason={setReason} // Passing setReason if needed
                        OpenRejectionModal={OpenRejectionModal}
                        handleCancelRejectionModal={handleCancelRejectionModal}
                        handleReject={handleReject}
                        isModalRejectionOpen={isModalRejectionOpen}
                      /> */}
                </td>
                {/* {client.status} */}
                {/* </span> */}
                {/* </td> */}
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
