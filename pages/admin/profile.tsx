import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "example/containers/Layout";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  date: string;
}

interface Admin {
  id: number;
  username: string;
  role: string;
  pictureurl: string;
  phonenumber: string;
  email: string;
}

export default function AdminProfile() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workStatus, setWorkStatus] = useState({
    tasksCompleted: 5,
    totalTasks: 10,
    progress: 50,
  });

  // Fetch admin data (including profile info) on component mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await axios.get("/api/admin/profile"); // Your GET endpoint for admin profile
        setAdmin(res.data);
      } catch (error) {
        console.error("Error fetching admin data", error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const res = await axios.get("/api/admin/transactions"); // Your GET endpoint for transactions
        setTransactions(res.data);
      } catch (error) {
        console.error("Error fetching transactions", error);
      }
    };

    fetchAdminData();
    fetchTransactions();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Profile</h1>

        {/* Profile Information Section */}
        <div className="mb-8 p-6 border border-gray-300 rounded">
          {admin && (
            <>
              <div className="flex items-center space-x-4">
                <img
                  src={admin.pictureurl || "/default-avatar.jpg"}
                  alt="Admin Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-2xl font-semibold">{admin.username}</h2>
                  <p className="text-sm text-gray-500">{admin.role}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-sm text-gray-500">{admin.phonenumber}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="mb-8 p-6 border border-gray-300 rounded">
          <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Transaction ID</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-4">{transaction.id}</td>
                    <td className="p-4">{transaction.type}</td>
                    <td className="p-4">${transaction.amount}</td>
                    <td className="p-4">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Progress Section */}
        <div className="mb-8 p-6 border border-gray-300 rounded">
          <h2 className="text-2xl font-semibold mb-4">Work Progress</h2>
          <div className="flex items-center justify-between">
            <p className="text-lg">Tasks Completed</p>
            <p className="text-lg">
              {workStatus.tasksCompleted} / {workStatus.totalTasks}
            </p>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${workStatus.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Admin Stats Section */}
        <div className="mb-8 p-6 border border-gray-300 rounded">
          <h2 className="text-2xl font-semibold mb-4">Admin Stats</h2>
          <div className="flex space-x-8">
            <div>
              <p className="font-semibold">Total Transactions</p>
              <p className="text-xl">{transactions.length}</p>
            </div>
            <div>
              <p className="font-semibold">Tasks Completed</p>
              <p className="text-xl">{workStatus.tasksCompleted}</p>
            </div>
            <div>
              <p className="font-semibold">Pending Tasks</p>
              <p className="text-xl">
                {workStatus.totalTasks - workStatus.tasksCompleted}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
