// import DashboardCard from "components/accDashboardcard";
import Sidebar from "components/accSidebar";
import { useEffect, useState } from "react";
import Pagination from "./pagination";
import { useRouter } from "next/router";
import prisma from "pages/api/globalprisma";
const Dashboard = ({ count }) => {
  const router = useRouter();
  const [prof, setTotalprof] = useState([]);
  const profits = async () => {
    const s = await fetch("/api/totalprofits");
    const res = await s.json();
    setTotalprof(res);
  };
  useEffect(() => {
    profits();
  }, []);
  function AddgoDays(date) {
    const currentDate = new Date(date); // Original date
    currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  const [data, setData] = useState([]);
  const [paginated, setPaginated] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (c) => {
    try {
      const queryParams = new URLSearchParams({
        searchTerm: "",
        page: String(c),
      });
      // console.log(queryParams.get(page));
      const response = await fetch(
        `/api/currentordersprismaforaccounant?${queryParams}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "get",
        }
      );

      const res = await response.json();
      if (res && res.length > 0) {
        setData(res); // Append new data
      } else {
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
    }
  };

  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }

  useEffect(() => {
    fetchData(1);
  }, []);
  const totalPages = 5; // You can replace this with the actual total pages count

  const handlePageChange = (page: number) => {
    // alert(page);
    setCurrentPage(page);
    fetchData(page);
    // You can also fetch data for the new page here, e.g. using an API call
  };
  const [daysRemaining, setDaysRemaining] = useState();

  // Target date (change this to your desired date)
  // const targetDate = new Date(
  //   AddgoDays(formData.arrivals[0]?.MusanadDuration || null)
  // );

  const calculateDaysRemaining = (targetDate) => {
    const currentDate = new Date();
    const diffTime = new Date(AddgoDays(targetDate) || null) - currentDate; // Difference in milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
    // setDaysRemaining(diffDays);
    return diffDays;
  };

  return (
    <div className="flex h-full bg-gray-100">
      <Sidebar />
      <div className=" p-6 bg-gray-100 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">صافي الارباح</h2>
              <p className="text-3xl font-bold">{prof[0]?.remaining_balance}</p>
            </div>
          </div>
          {/* <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">حجوزات مكتملة</h2>
              <p className="text-3xl font-bold">320</p>
            </div>
          </div> */}
          {/* <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">حجوزات مرفوضة</h2>
              <p className="text-3xl font-bold">120</p>
            </div>  
          </div> */}
        </div>

        <table
          className=" table-auto bg-white border  border-gray-200 rounded-lg shadow-md overflow-y-auto"
          dir="rtl"
        >
          <thead className="bg-gray-100 ">
            <tr>
              <th className="py-3 px-6 text-center    font-semibold text-gray-700">
                رقم المساند
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                اسم العميل
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                هاتف جوال العميل
              </th>
              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                المكتب
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                الجنسية
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                الربح الفعلي
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                تاريخ الوصول
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                شهر الوصول
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                تاريخ نهاية الضمان
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                شهر نهاية الضمان
              </th>
              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                متبقى على انتهاء الضمان
              </th>

              <th className="py-3 px-6 text-center  font-semibold text-gray-700">
                تاريخ الطلب
              </th>

              {/* <th className="py-3 px-6 text-center font-semibold text-gray-700">
                Balance
              </th> */}
            </tr>
          </thead>
          <tbody>
            {data.map((transaction, index) => (
              <tr
                key={index}
                className="border-t cursor-pointer hover:bg-gray-50"
              >
                <td
                  onClick={() =>
                    router.push(
                      "/accounting/invoicedetails?client=" +
                        transaction.clientID +
                        "&" +
                        "homemaidId=" +
                        transaction.id
                    )
                  }
                  className="py-3 px-6 border-gray-700 cursor-pointer text-purple-700 "
                >
                  {transaction?.InternalmusanedContract}
                </td>
                <td
                  onClick={() =>
                    router.push(
                      "/accounting/invoicedetails?client=" +
                        transaction.clientID +
                        "&" +
                        "homemaidId=" +
                        transaction.id
                    )
                  }
                  className="py-3 px-6 border-gray-700 text-purple-700 "
                >
                  {transaction?.ClientName}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.clientphonenumber}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 flex flex-nowrap">
                  {transaction.officeName}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction.Country}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction.remaining}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.KingdomentryDate
                    ? getDate(transaction.KingdomentryDate)
                    : null}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {" "}
                  {transaction?.KingdomentryDate
                    ? new Date(transaction.KingdomentryDate).getMonth() + 1
                    : null}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.KingdomentryDate
                    ? AddgoDays(transaction.KingdomentryDate)
                    : null}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.KingdomentryDate
                    ? new Date(
                        AddgoDays(transaction.KingdomentryDate)
                      ).getMonth() + 1
                    : null}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.KingdomentryDate
                    ? calculateDaysRemaining(transaction.KingdomentryDate)
                    : null}
                </td>
                <td className="py-3 px-6 border-gray-700 text-gray-700 ">
                  {transaction?.createdAt
                    ? getDate(transaction?.createdAt)
                    : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(Number(count.count) / 10)}
          onPageChange={handlePageChange}
        />
      </div>
      <div className="overflow-x-auto p-4"></div>
    </div>
  );
};

export default Dashboard;

export async function getServerSideProps(context: NextPageContext) {
  const { req, res } = context;
  try {
    const waiter = await prisma.$queryRaw`
SELECT 
    CAST(COUNT(*) AS CHAR) AS count
FROM (
    SELECT 
        h.Name,
        h.officeName,
        o.Country,
        a.KingdomentryDate,
        a.KingdomentryTime,
        no.createdAt,
        no.clientID,
        no.id,
        no.ClientName,
        no.clientphonenumber,
        no.PhoneNumber
    FROM 
        neworder no
    LEFT JOIN 
        transactions t ON no.id = t.order_id
    LEFT JOIN
        arrivallist a ON no.id = a.OrderId
    LEFT JOIN 
        homemaid h ON h.id = no.HomemaidId
    LEFT JOIN
        offices o ON o.office = h.officeName
    GROUP BY 
        no.id, 
        a.KingdomentryDate, 
        a.KingdomentryTime, 
        no.createdAt,
        no.clientID,
        no.clientphonenumber,
        no.ClientName, 
        no.PhoneNumber,
        a.InternalmusanedContract, 
        h.officeName,
        h.Name, 
        o.Country
    ORDER BY 
        no.id DESC
) AS subquery;

`;
    console.log(waiter[0]);
    // const isAuthenticated = req.cookies.authToken ? true : false;
    // console.log(req.cookies.authToken);
    // // jwtDecode(req.cookies.)
    // if (!isAuthenticated) {
    //   // Redirect the user to login page before rendering the component
    //   return {
    //     redirect: {
    //       destination: "/admin/login", // Redirect URL
    //       permanent: false, // Set to true if you want a permanent redirect
    //     },
    //   };
    // }
    // console.log(waiter.count);
    // const user = jwt.verify(req.cookies.authToken, "rawaesecret");
    // console.log(user);
    // // If authenticated, continue with rendering the page
    return {
      props: { count: waiter[0] }, // Empty object to pass props if needed
    };
  } catch (error) {
    console.log("error");
    // return {
    //   redirect: {
    //     destination: "/admin/login", // Redirect URL
    //     permanent: false, // Set to true if you want a permanent redirect
    //   },
    // };
  }
}
