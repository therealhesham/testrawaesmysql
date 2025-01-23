//@ts-nocheck
//@ts-nocheck

import React, { useState } from "react";
import { useRouter } from "next/router";

const RejectBooking = ({
  handleCancelRejectionModal,
  handleReject,
  reason,
  setReason, // make sure setReason is passed if you need it
  OpenRejectionModal,
  isModalRejectionOpen,
}) => {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      {/* Trigger button to open modal */}
      <button
        onClick={OpenRejectionModal} // This is now correctly passed as a prop
        className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        رفض الطلب
      </button>

      {/* Modal Section */}
      {isModalRejectionOpen && (
        <div className="fixed inset-0  bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6 w-96">
            <h1 className="text-2xl font-semibold text-gray-800">
              رفض طلب العميل
            </h1>

            {/* Booking Details Section */}
            <div className="border-b pb-4">
              <p className="text-gray-600">
                رقم الحجز: <strong></strong>
              </p>
              <p className="text-gray-600">
                اسم العميل: <strong></strong>
              </p>
              <p className="text-gray-600">
                تاريخ الحجز: <strong>Jan 25, 2025</strong>
              </p>
              <p className="text-gray-600">
                حالة الحجز: <span className="text-red-500">Pending</span>
              </p>
            </div>

            {/* Reason for rejection (Text Area instead of select) */}
            <div>
              <label
                htmlFor="reason"
                className="block text-gray-700 font-medium mb-2"
              >
                سبب الرفض
              </label>
              <textarea
                id="reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="سبب الحجز..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4} // Adjust the number of rows as needed
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelRejectionModal}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                اغلاق
              </button>
              <button
                onClick={handleReject}
                disabled={!reason}
                className={`px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 ${
                  reason
                    ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                تأكيد
              </button>
            </div>

            {/* Close modal when clicked outside */}
            <div />
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectBooking;
