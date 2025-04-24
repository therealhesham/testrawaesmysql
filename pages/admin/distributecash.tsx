"use client";

import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [formData, setFormData] = useState({
    month: "",
    year: "",
    checkDate: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, forceDistribute = false) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/distributecash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, forceDistribute }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.existingDistribution && !forceDistribute) {
        setModalMessage(data.message);
        setShowModal(true);
        setLoading(false);
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = async () => {
    setShowModal(false);
    await handleSubmit({ preventDefault: () => {} }, true); // Proceed with forceDistribute = true
  };

  const handleModalCancel = () => {
    setShowModal(false);
    setError("تم إلغاء التوزيع.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Head>
        <title>توزيع - شركة روائس للاستقدام نقدي</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          توزيع نقدي
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="month"
              className="block text-sm font-medium text-gray-700"
            >
              الشهر
            </label>
            <input
              type="text"
              id="month"
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: 01"
            />
          </div>

          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-gray-700"
            >
              العام
            </label>
            <input
              type="text"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: 2025"
            />
          </div>

          <div>
            <label
              htmlFor="checkDate"
              className="block text-sm font-medium text-gray-700"
            >
              تاريخ التسجيل
            </label>
            <input
              type="date"
              id="checkDate"
              name="checkDate"
              value={formData.checkDate}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "جارٍ الحساب..." : "احسب"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
            <h2 className="text-lg font-semibold">النتائج</h2>
            <p>
              <strong>التاريخ:</strong> {result.date}
            </p>
            <p>
              <strong>عدد العمال:</strong> {result.workerCount}
            </p>
            <p>
              <strong>التكلفة لكل عامل:</strong> {result.costPerWorker}
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              تأكيد التوزيع
            </h2>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalCancel}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                إلغاء
              </button>
              <button
                onClick={handleModalConfirm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                أوافق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
