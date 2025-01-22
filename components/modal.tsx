// components/Modal.tsx
import { useState } from "react";

type ModalProps = {
  isOpen: boolean;
  message: string;
  type: "success" | "error";
  onClose: () => void;
};

const Modal = ({ isOpen, message, type, onClose }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-500 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div
          className={`flex items-center ${
            type === "success" ? "text-green-500" : "text-red-500"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            {type === "success" ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            )}
          </svg>
          <h2 className="text-lg font-semibold">
            {type === "success" ? "Success" : "Error"}
          </h2>
        </div>
        <p className="mt-4 text-gray-700">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
