//@ts-ignore
//@ts-nocheck
import { useState } from "react";

const SpinnerModal = ({ isOpen }) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-64 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-solid rounded-full animate-spin border-t-blue-500"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SpinnerModal;
