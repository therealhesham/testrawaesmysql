import { Doughnut, Bar } from "react-chartjs-2"; // Import Bar chart
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js"; // Register the necessary elements for Bar chart
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Layout from "example/containers/Layout";

// Register necessary components for Chart.js
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function Home() {
  // Example data for the Donut chart
  const dataDonut = {
    labels: ["حجوزات جديدة", "حجوزات حالية", "حجوزات مرفوضة"],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ["#4CAF50", "#FF9800", "#F44336"],
        hoverBackgroundColor: ["#45A049", "#FF8C1A", "#D32F2F"],
        borderWidth: 1,
      },
    ],
  };

  // Example data for the Bar chart
  const dataBar = {
    labels: ["January", "February", "March", "April", "May"],
    datasets: [
      {
        label: "Sales",
        data: [1000, 1200, 900, 1300, 1100],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="container mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-8">
            Reports Dashboard
          </h1>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg flex justify-center items-center">
              <div>
                <h2 className="text-xl font-semibold">اجمالي الدفعات</h2>
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

          {/* Charts side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Donut Chart */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-center mb-4">
                Task Completion Status
              </h2>
              <div className="flex justify-center">
                <Doughnut data={dataDonut} options={options} />
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-center mb-4">
                Monthly Sales
              </h2>
              <div className="flex justify-center">
                <Bar data={dataBar} options={options} />
              </div>
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
