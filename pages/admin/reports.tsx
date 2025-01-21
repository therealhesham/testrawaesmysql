// pages/report.tsx

import { useRef } from "react";

function ReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "", "height=500, width=800");
      printWindow?.document.write(
        "<html><head><title>Report</title></head><body>"
      );
      printWindow?.document.write(reportRef.current.innerHTML);
      printWindow?.document.write("</body></html>");
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  return (
    <div>
      <h1 className="text-center text-3xl font-bold py-6">UI/UX Report</h1>
      <div
        ref={reportRef}
        className="container mx-auto p-4 border-2 border-gray-300"
      >
        <h2 className="text-2xl font-semibold mb-4">Report Summary</h2>
        <p className="mb-4">
          This report showcases the current status of the UI/UX design for our
          project. It includes metrics, user feedback, and design improvements.
        </p>
        <h3 className="text-xl font-semibold mb-3">User Feedback:</h3>
        <ul className="mb-4">
          <li>Positive: 80%</li>
          <li>Negative: 10%</li>
          <li>Neutral: 10%</li>
        </ul>
        <h3 className="text-xl font-semibold mb-3">Next Steps:</h3>
        <ul>
          <li>Improve navigation accessibility</li>
          <li>Update color scheme based on feedback</li>
          <li>Test with a broader audience</li>
        </ul>
      </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}

export default ReportPage;
