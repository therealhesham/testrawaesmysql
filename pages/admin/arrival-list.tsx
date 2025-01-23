import Layout from "example/containers/Layout";
import { useEffect, useState } from "react";

const ResponsiveTable = () => {
  const [arrivalList, setArrivalList] = useState<any[]>([]);

  useEffect(() => {
    // Example data fetching (replace with your actual API call or Prisma query)
    const fetchData = async () => {
      const response = await fetch("/api/arrivals");
      const data = await response.json();
      console.log(data);
      setArrivalList(data);
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="overflow-x-auto p-4">
        <div className="flex items-center justify-center">
          <p className="text-2xl font-bold text-cool-gray-700 mb-5">
            قائمة الوصول
          </p>
        </div>

        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                اسم الكفيل
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                عقد مساند الداخلي
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                هوية الكفيل
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                جوال الكفيل
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                رقم جواز السفر
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Kingdom Entry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Work Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Homemaid ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Homemaid Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Arrival City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                Application Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {arrivalList.map((row) => (
              <tr key={row.id} className="divide-y divide-gray-200">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 whitespace-nowrap">
                  {row.SponsorName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.InternalmusanedContract}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.SponsorIdnumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.SponsorPhoneNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.PassportNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.KingdomentryDate}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.WorkDuration}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.Cost}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.HomemaIdnumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.HomemaidName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {row.ArrivalCity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 border border-gray-300 whitespace-nowrap">
                  {new Date(row.DateOfApplication).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default ResponsiveTable;
