import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Layout from "example/containers/Layout";
// Register necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  // Example chart data (Donut chart)
  const data = {
    labels: ["Completed", "In Progress", "Pending"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ["#4CAF50", "#FF9800", "#F44336"],
        hoverBackgroundColor: ["#45A049", "#FF8C1A", "#D32F2F"],
        borderWidth: 1,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  // Data for the table that could be exported to Excel
  const reportData = [
    { name: "John Doe", sales: 1500, region: "North" },
    { name: "Jane Smith", sales: 2300, region: "South" },
    { name: "Sam Wilson", sales: 1900, region: "East" },
  ];

  // Excel export function
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "report.xlsx");
  };

  // PDF export function
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Report", 14, 20);

    // Adding a table in PDF
    doc.autoTable({
      head: [["Name", "Sales", "Region"]],
      body: reportData.map((item) => [item.name, item.sales, item.region]),
      startY: 30,
    });

    // Save the PDF
    doc.save("report.pdf");
  };

  return (
    <Layout>
      {" "}
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="container mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">Dashboard</h1>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
              <div>
                <h2 className="text-xl font-semibold">Total Sales</h2>
                <p className="text-3xl font-bold">$45,300</p>
              </div>
            </div>
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
              <div>
                <h2 className="text-xl font-semibold">Completed Tasks</h2>
                <p className="text-3xl font-bold">320</p>
              </div>
            </div>
            <div className="bg-orange-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
              <div>
                <h2 className="text-xl font-semibold">Pending Tasks</h2>
                <p className="text-3xl font-bold">120</p>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-center mb-4">
              Task Completion Status
            </h2>
            <div className="flex justify-center">
              <Doughnut data={data} options={options} />
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex justify-center gap-6">
            <button
              onClick={exportToPDF}
              className="bg-red-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-600"
            >
              Download PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-600"
            >
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
