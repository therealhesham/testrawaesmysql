// import DashboardCard from "components/accDashboardcard";
import Sidebar from "components/accSidebar";
const Dashboard = () => {
  const transactions = [
    {
      date: "2025-02-01",
      transactionId: "TX12345",
      description: "Payment received",
      debit: 0,
      credit: 500,
      balance: 500,
    },
    {
      date: "2025-02-02",
      transactionId: "TX12346",
      description: "Office supplies purchase",
      debit: 200,
      credit: 0,
      balance: 300,
    },
    {
      date: "2025-02-03",
      transactionId: "TX12347",
      description: "Invoice payment",
      debit: 0,
      credit: 150,
      balance: 450,
    },
  ];
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-6 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">صافي الارباح</h2>
              <p className="text-3xl font-bold">45,300</p>
            </div>
          </div>
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">حجوزات مكتملة</h2>
              <p className="text-3xl font-bold">320</p>
            </div>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
            <div>
              <h2 className="text-xl font-semibold">حجوزات مرفوضة</h2>
              <p className="text-3xl font-bold">120</p>
            </div>
          </div>
        </div>

        <table className="min-w-full table-auto bg-white border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Date
              </th>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Transaction ID
              </th>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Description
              </th>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Debit
              </th>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Credit
              </th>
              <th className="py-3 px-6 text-left font-semibold text-gray-700">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="py-3 px-6 text-gray-700">{transaction.date}</td>
                <td className="py-3 px-6 text-gray-700">
                  {transaction.transactionId}
                </td>
                <td className="py-3 px-6 text-gray-700">
                  {transaction.description}
                </td>
                <td className="py-3 px-6 text-gray-700">
                  {transaction.debit ? `$${transaction.debit}` : "-"}
                </td>
                <td className="py-3 px-6 text-gray-700">
                  {transaction.credit ? `$${transaction.credit}` : "-"}
                </td>
                <td className="py-3 px-6 text-gray-700">{`$${transaction.balance}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto p-4"></div>
    </div>
  );
};

export default Dashboard;
