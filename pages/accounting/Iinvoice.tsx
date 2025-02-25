import React from "react";

export default function Invoice() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice</h1>
          <p className="text-gray-600">Date: February 21, 2025</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Company Name</h2>
          <p className="text-gray-600">123 Business St.</p>
          <p className="text-gray-600">City, State, ZIP</p>
          <p className="text-gray-600">Phone: (123) 456-7890</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold">Bill To:</h3>
          <p className="text-gray-600">Client Name</p>
          <p className="text-gray-600">Client Address</p>
          <p className="text-gray-600">City, State, ZIP</p>
          <p className="text-gray-600">Email: client@example.com</p>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-semibold">Invoice #:</h3>
          <p className="text-gray-600">123456</p>
          <h3 className="text-lg font-semibold mt-2">Due Date:</h3>
          <p className="text-gray-600">March 1, 2025</p>
        </div>
      </div>

      <table className="w-full table-auto mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 text-left">Description</th>
            <th className="py-2 px-4 text-left">Quantity</th>
            <th className="py-2 px-4 text-left">Unit Price</th>
            <th className="py-2 px-4 text-left">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 px-4">Web Development Services</td>
            <td className="py-2 px-4">1</td>
            <td className="py-2 px-4">$1000</td>
            <td className="py-2 px-4">$1000</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 px-4">Design Work</td>
            <td className="py-2 px-4">2</td>
            <td className="py-2 px-4">$500</td>
            <td className="py-2 px-4">$1000</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 px-4 font-semibold text-right" colSpan="3">
              <span className="mr-4">Subtotal</span>
            </td>
            <td className="py-2 px-4">$2000</td>
          </tr>
          <tr>
            <td className="py-2 px-4 font-semibold text-right" colSpan="3">
              <span className="mr-4">Tax (5%)</span>
            </td>
            <td className="py-2 px-4">$100</td>
          </tr>
          <tr className="font-semibold">
            <td className="py-2 px-4 text-right" colSpan="3">
              <span className="mr-4">Total Due</span>
            </td>
            <td className="py-2 px-4">$2100</td>
          </tr>
        </tbody>
      </table>

      <div className="text-center">
        <p className="text-gray-600">Thank you for your business!</p>
      </div>
    </div>
  );
}
