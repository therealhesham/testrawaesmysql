import Layout from "example/containers/Layout";
import { useEffect, useState } from "react";

const ArrivalListTable = () => {
  const [arrivalList, setArrivalList] = useState<any[]>([]);

  // Fetch data from an API or database
  useEffect(() => {
    // Example data fetching (replace with your actual API call or Prisma query)
    const fetchData = async () => {
      const response = await fetch("/api/arrivals");
      const data = await response.json();
      setArrivalList(data);
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 py-6 ">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Arrival List</h1>
        <div className="overflow-hidden shadow border-b border-gray-200 sm:rounded-lg">
          <table className=" min-w-full table-auto border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  اسم الكفيل
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  عقد مساند الداخلي
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  هوية الكفيل
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  جوال الكفيل
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  رقم جواز السفر
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kingdom Entry Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Work Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cost
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Homemaid ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Homemaid Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Arrival City
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Application Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {arrivalList.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-lg font-medium text-gray-900">
                    {row.SponsorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.InternalmusanedContract}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.SponsorIdnumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.SponsorPhoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.PassportNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.KingdomentryDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.WorkDuration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.Cost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.HomemaIdnumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.HomemaidName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {row.ArrivalCity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-500">
                    {new Date(row.DateOfApplication).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ArrivalListTable;
