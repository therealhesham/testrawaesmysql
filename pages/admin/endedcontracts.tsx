import { BookFilled } from "@ant-design/icons";
import Layout from "example/containers/Layout";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback, useRef } from "react";
import jwt from "jsonwebtoken";
import { Button, Modal, Box, TextField, MenuItem, Typography } from "@mui/material";
import Style from "styles/Home.module.css";

export default function Table() {
  const [filters, setFilters] = useState({
    ClientName: "",
    age: "",
    clientphonenumber: "",
    Passportnumber: "",
    Nationality: "",
    HomemaidId: "",
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: "",
    rating: "",
    Discription: "",
  });

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  // Fetch data with pagination
  const fetchData = async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        searchTerm: filters.ClientName,
        age: filters.age,
        clientphonenumber: filters.clientphonenumber,
        HomemaidId: filters.HomemaidId,
        Passportnumber: filters.Passportnumber,
        Nationalitycopy: filters.Nationality,
        page: String(pageRef.current),
      });

      const response = await fetch(`/api/endedcontracts?${queryParams}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "get",
      });

      const res = await response.json();
      if (res && res.length > 0) {
        setData((prevData) => [...prevData, ...res]);
        pageRef.current += 1;
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const makeRequest = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return response.status === 200;
  };

  const restore = async (id, homeMaidId) => {
    const success = await makeRequest("/api/restoreorders", {
      id,
      homeMaidId,
    });
    if (success) router.push("/admin/neworders");
  };

  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reportForm,
          orderId: selectedOrderId,
        }),
      });

      if (response.status === 201) {
        alert("Report submitted successfully!");
        setOpenModal(false);
        setReportForm({ title: "", rating: "", Discription: "" });
        setSelectedOrderId(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report");
    }
  };

  const loadMoreRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchData();
          }
        },
        { threshold: 1.0 }
      );

      if (node) observer.observe(node);

      return () => observer.disconnect();
    },
    [loading, hasMore]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (e, column) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const router = useRouter();
  const handleUpdate = (id) => {
    router.push("./neworder/" + id);
  };

  // Modal open/close handlers
  const handleOpenModal = (orderId) => {
    setSelectedOrderId(orderId);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setReportForm({ title: "", rating: "", Discription: "" });
    setSelectedOrderId(null);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1
          className={`text-center font-medium text-2xl mb-4 ${Style["almarai-bold"]}`}
        >
          العقود المنتهية
        </h1>

        {/* Filter Section */}
        <div className="flex justify-between mb-4">
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.ClientName}
              onChange={(e) => handleFilterChange(e, "ClientName")}
              placeholder="بحث باسم العميل / العاملة"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passportnumber}
              onChange={(e) => handleFilterChange(e, "Passportnumber")}
              placeholder="بحث برقم جواز السفر"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <input
              type="text"
              value={filters.clientphonenumber}
              onChange={(e) => handleFilterChange(e, "clientphonenumber")}
              placeholder="بحث برقم الجوال"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.HomemaidId}
              onChange={(e) => handleFilterChange(e, "HomemaidId")}
              placeholder="بحث برقم العاملة"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 px-1">
            <Button
              className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setFilters({
                  clientphonenumber: "",
                  age: "",
                  ClientName: "",
                  HomemaidId: "",
                  Nationality: "",
                  Passportnumber: "",
                });
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-regular"]}>اعادة ضبط</h1>
            </Button>
          </div>
          <div className="flex-1 px-1">
            <Button
              className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
              onClick={() => {
                isFetchingRef.current = false;
                setHasMore(true);
                setData([]);
                pageRef.current = 1;
                fetchData();
              }}
            >
              <h1 className={Style["almarai-regular"]}>بحث</h1>
            </Button>
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="text-white bg-yellow-400">
              <th className="p-3 text-center text-md font-medium">رقم الطلب</th>
              <th className="p-3 text-center text-md font-medium">الاسم</th>
              <th className="p-3 text-center text-md font-medium">جوال العميل</th>
              <th className="p-3 text-center text-md font-medium">جواز سفر العاملة</th>
              <th className="p-3 text-center text-md font-medium">رقم العاملة</th>
              <th className="p-3 text-center text-md font-medium">الجنسية</th>
              <th className="p-3 text-center text-md font-medium">استعراض</th>
              <th className="p-3 text-center text-md font-medium">تقرير</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="p-3 text-center text-md text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 text-md text-teal-600 cursor-pointer text-center">
                    {item.id}
                  </td>
                  <td className="p-3 text-md text-gray-600 text-center">
                    {item.ClientName}
                  </td>
                  <td className="p-3 text-md text-gray-700 text-center">
                    {item.clientphonenumber}
                  </td>
                  <td className="p-3 text-md text-gray-700 text-center">
                    {item.HomeMaid.Passportnumber}
                  </td>
                  <td className="p-3 text-md text-gray-700 text-center">
                    {item.HomemaidId}
                  </td>
                 
                  <td className="p-3 text-md text-gray-700 text-center">
                    {item?.HomeMaid?.office.Country}
                  </td>
                  <td className="p-3 text-md text-gray-700 text-center">
                    <Button
                      className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md transition-all duration-300"
                      onClick={() => handleUpdate(item.id)}
                    >
                      <h1 className={Style["almarai-regular"]}>عرض</h1>
                    </Button>
                  </td>
                  <td className="p-3 text-md text-gray-700 text-center">
                    <Button
                      className="text-[#EFF7F9] bg-[#888d6b] text-lg py-2 px-4 rounded-md "
                      onClick={() => handleOpenModal(item.clientID)}
                    >
                      <h1 className={Style["almarai-regular"]}>إضافة تقرير</h1>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Modal for Report Submission */}
        <Modal
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography id="modal-title" variant="h6" component="h2">
              إضافة تقرير
            </Typography>
            <form onSubmit={handleReportSubmit}>
              <TextField
                fullWidth
                label="العنوان"
                name="title"
                value={reportForm.title}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                select
                label="التقييم"
                name="rating"
                value={reportForm.rating}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
              >
                {['ممتاز', 'جيد', 'متوسط', 'ضعيف'].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="الوصف"
                name="Discription"
                value={reportForm.Discription}
                onChange={handleFormChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="submit"
                  className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md"
                >
                  <h1 className={Style["almarai-regular"]}>إرسال</h1>
                </Button>
                <Button
                  className="text-[#EFF7F9] bg-[#3D4C73] text-lg py-2 px-4 rounded-md"
                  onClick={handleCloseModal}
                >
                  <h1 className={Style["almarai-regular"]}>إلغاء</h1>
                </Button>
              </Box>
            </form>
          </Box>
        </Modal>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center mt-6">
            {loading && (
              <div className="flex justify-center items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-3 text-purple-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4V1m0 22v-3m8-6h3m-22 0H4m16.243-7.757l2.121-2.121m-16.97 0L5.757 5.757M12 9v3m0 0v3m0-3h3m-3 0H9"
                  />
                </svg>
                Loading...
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}