// components/ErrorModal.js

import { useState } from "react";

export default function ErrorModal({ message, onClose, isErrorModalOpen }) {
  return isErrorModalOpen ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold text-red-500">
          {message ? "خطا في التسجيل" : "طلب مرفوض"}
        </h2>
        <p className="text-sm text-gray-800 mt-2">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  ) : null;
}
