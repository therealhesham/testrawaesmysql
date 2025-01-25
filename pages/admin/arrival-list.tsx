import { useState, useEffect } from "react";
import Layout from "example/containers/Layout";

const ResponsiveTable = () => {
  const [arrivalList, setArrivalList] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState({
    SponsorName: true,
    PassportNumber: true,
    ArrivalCity: true,
    KingdomentryDate: true,
    WorkDuration: false,
    Cost: false,
    HomemaidID: false,
    HomemaidName: false,
    ApplicationDate: false,
  });

  // Arabic column names mapping
  const columnNames = {
    SponsorName: "اسم الكفيل",
    PassportNumber: "رقم جواز السفر",
    ArrivalCity: "مدينة الوصول",
    KingdomentryDate: "تاريخ الدخول إلى المملكة",
    WorkDuration: "مدة العمل",
    Cost: "التكلفة",
    HomemaidID: "هوية الخادمة",
    HomemaidName: "اسم الخادمة",
    ApplicationDate: "تاريخ التقديم",
  };

  const fetchData = async () => {
    // alert("s");
    const response = await fetch("/api/arrivals", { method: "get" });
    const data = await response.json();
    setArrivalList(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle column visibility
  const handleColumnToggle = (column: string) => {
    setSelectedColumns((prevState) => ({
      ...prevState,
      [column]: !prevState[column],
    }));
  };

  return (
    <Layout>
      <div className="overflow-x-auto p-6">
        <div className="flex items-center justify-center">
          <p className="text-2xl font-bold text-cool-gray-700 mb-5">
            قائمة الوصول
          </p>
        </div>

        {/* Column visibility toggle */}
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">اختر الأعمدة لعرضها</h2>
          <div className="space-x-4">
            {Object.keys(selectedColumns).map((column) => (
              <label key={column} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedColumns[column]}
                  onChange={() => handleColumnToggle(column)}
                  className="form-checkbox"
                />
                <span className="ml-2">{columnNames[column]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-md">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                {Object.keys(selectedColumns)
                  .filter((column) => selectedColumns[column])
                  .map((column) => (
                    <th key={column} className="px-4 py-2 text-sm font-medium">
                      {columnNames[column]}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {arrivalList.map((row) => (
                <tr key={row.id} className="divide-y divide-gray-200">
                  {Object.keys(selectedColumns)
                    .filter((column) => selectedColumns[column])
                    .map((column) => (
                      <td
                        key={column}
                        className="px-6 py-4 text-md font-medium text-black border border-gray-300 whitespace-nowrap"
                      >
                        {row[column] || "N/A"}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ResponsiveTable;
