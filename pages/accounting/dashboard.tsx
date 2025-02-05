import DashboardCard from "components/accDashboardcard";
import Sidebar from "components/accSidebar";
const Dashboard = () => {
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
      </div>
    </div>
  );
};

export default Dashboard;
