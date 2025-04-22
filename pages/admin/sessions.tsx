import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "example/containers/Layout";

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [reasonFilter, setReasonFilter] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        ...(reasonFilter && { reason: reasonFilter }),
        ...(nationalityFilter && { Nationality: nationalityFilter }),
        ...(sortKey && { sortKey, sortDirection }),
      }).toString();

      const response = await fetch(`/api/sessions?${query}`);
      const data = await response.json();
      setSessions(data.session || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [page, reasonFilter, nationalityFilter, sortKey, sortDirection]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
  function getDate(date) {
    const currentDate = new Date(date); // Original date
    // currentDate.setDate(currentDate.getDate() + 90); // Add 90 days
    const form = currentDate.toISOString().split("T")[0];
    console.log(currentDate);
    return form;
  }
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <Head>
          <title>جلسات المحاكمة</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <h1 className="text-2xl font-bold mb-4">بيانات الجلسات</h1>

        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Filter by reason"
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  ID {sortKey === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => handleSort("reason")}
                >
                  سبب الجلسة
                  {sortKey === "reason" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-4 py-2 border cursor-pointer"
                  onClick={() => handleSort("Nationalitycopy")}
                >
                  اسم العاملة
                  {sortKey === "Nationalitycopy" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-2 border">تاريخ الجلسة</th>
                <th className="px-4 py-2 border">موعد الجلسة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-4 py-2 border">{session.id}</td>
                    <td className="px-4 py-2 border">{session.reason}</td>
                    <td className="px-4 py-2 border">{session.user?.Name}</td>
                    <td className="px-4 py-2 border">
                      {getDate(session.date)}
                    </td>
                    <td className="px-4 py-2 border">{session.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={sessions.length < 10}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  );
}
