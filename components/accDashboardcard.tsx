const DashboardCard = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl text-gray-700">{value}</p>
    </div>
  );
};

export default DashboardCard;
