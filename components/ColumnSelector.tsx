import React, { useState } from 'react';
import { ArrowLeftIcon } from "@heroicons/react/outline";

interface ColumnSelectorProps {
  visibleColumns: { [key: string]: boolean };
  setVisibleColumns: (columns: { [key: string]: boolean }) => void;
  columns: Array<{ key: string; label: string }>;
  buttonText?: string;
  buttonStyle?: string;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  visibleColumns,
  setVisibleColumns,
  columns,
  buttonText = "اختر الأعمدة",
  buttonStyle = "bg-gray-400 px-3 py-2 h-16 items-center align-baseline text-white rounded-md"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const selectAllColumns = () => {
    const allSelected = columns.reduce((acc, column) => {
      acc[column.key] = true;
      return acc;
    }, {} as { [key: string]: boolean });
    setVisibleColumns(allSelected);
  };

  const deselectAllColumns = () => {
    const noneSelected = columns.reduce((acc, column) => {
      acc[column.key] = false;
      return acc;
    }, {} as { [key: string]: boolean });
    setVisibleColumns(noneSelected);
  };

  return (
    <div className="relative">
      <button
        className={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400">
          {buttonText}
        </span>
        <ArrowLeftIcon className="w-4 h-4 text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="flex gap-2 mb-3">
              <button
                onClick={selectAllColumns}
                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
              >
                تحديد الكل
              </button>
              <button
                onClick={deselectAllColumns}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
              >
                إلغاء الكل
              </button>
            </div>
            <div className="space-y-2">
              {columns.map((column) => (
                <label key={column.key} className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key] || false}
                    onChange={() => toggleColumn(column.key)}
                    className="form-checkbox h-4 w-4 text-teal-900"
                  />
                  <span className="text-gray-700">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
