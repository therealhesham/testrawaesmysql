// pages/reject-booking.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";

const RejectBooking = () => {
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleReject = () => {
    // Implement rejection logic here (e.g., API call to reject the booking)
    console.log("Booking rejected for reason:", reason);
    // Redirect to another page after rejecting the booking
    router.push("/admin/bookings"); // Or any page you want to navigate to
  };

  const handleCancel = () => {
    router.push("/admin/bookings"); // Or any page to go back to
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-800">Reject Booking</h1>

        {/* Booking Details Section */}
        <div className="border-b pb-4">
          <p className="text-gray-600">
            Booking ID: <strong>#123456</strong>
          </p>
          <p className="text-gray-600">
            Customer Name: <strong>John Doe</strong>
          </p>
          <p className="text-gray-600">
            Date of Booking: <strong>Jan 25, 2025</strong>
          </p>
          <p className="text-gray-600">
            Booking Status: <span className="text-red-500">Pending</span>
          </p>
        </div>

        {/* Reason for rejection */}
        <div>
          <label
            htmlFor="reason"
            className="block text-gray-700 font-medium mb-2"
          >
            Reason for Rejection
          </label>
          <select
            id="reason"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a reason...</option>
            <option value="customer_requested">
              Customer requested cancellation
            </option>
            <option value="invalid_details">Invalid details provided</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
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
            Reject Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectBooking;
