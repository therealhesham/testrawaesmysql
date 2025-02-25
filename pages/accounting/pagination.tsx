import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Prev Button */}
      <button
        onClick={handlePrev}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex space-x-2">
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-md ${
              page === currentPage
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
function TableWithPagination() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // You can replace this with the actual total pages count

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // You can also fetch data for the new page here, e.g. using an API call
  };

  return (
    <div>
      {/* جدول البيانات */}
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">#</th>
            <th className="px-4 py-2 border-b">Order ID</th>
            <th className="px-4 py-2 border-b">Amount</th>
            <th className="px-4 py-2 border-b">Transaction Type</th>
            <th className="px-4 py-2 border-b">Details</th>
          </tr>
        </thead>
        <tbody>
          {/* بيانات الجدول */}
          {/* يمكنك هنا تكرار الصفوف حسب البيانات الموجودة لديك */}
          <tr>
            <td className="px-4 py-2 border-b">1</td>
            <td className="px-4 py-2 border-b">12345</td>
            <td className="px-4 py-2 border-b">$100</td>
            <td className="px-4 py-2 border-b">Deposit</td>
            <td className="px-4 py-2 border-b">Payment for order</td>
          </tr>
          {/* أضف المزيد من الصفوف حسب البيانات */}
        </tbody>
      </table>

      {/* شريط التنقل بين الصفحات */}
    </div>
  );
}
