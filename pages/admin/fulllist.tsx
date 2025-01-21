//@ts-nocheck
//@ts-ignore

import axios from "axios";
import Layout from "example/containers/Layout";
import { useEffect, useState } from "react";

export default function Table(props) {
  const [filters, setFilters] = useState({
    Name: "",
    age: "",
    Passport: "",
  });
  console.log(props.waiter);

  const fetchData = async (page) => {
    try {
      const response = await axios.get(`/api/homemaidprisma/`);
      //  setPagesCount(response.data.count);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle filtering by each column
  const handleFilterChange = (e, column) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  // Function to apply filters to data
  const filteredData = props.waiter.filter((item) => {
    return (
      (filters.Name === "" ||
        item.Name.toLowerCase().includes(filters.Name.toLowerCase())) &&
      (filters.age === "" || item.age.toString().includes(filters.age)) &&
      (filters.Passport === "" ||
        item.Passport.toLowerCase().includes(filters.Passport.toLowerCase()))
    );
  });

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold text-center mb-4">العاملات</h1>

        {/* Column Filters */}
        <div className="flex justify-between mb-4">
          {/* Name Filter */}
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Name}
              onChange={(e) => handleFilterChange(e, "name")}
              placeholder="Filter by Name"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {/* Age Filter */}
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.age}
              onChange={(e) => handleFilterChange(e, "age")}
              placeholder="Filter by Age"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {/* Role Filter */}
          <div className="flex-1 px-2">
            <input
              type="text"
              value={filters.Passport}
              onChange={(e) => handleFilterChange(e, "role")}
              placeholder="Filter by Role"
              className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Table */}
        <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-md">
          <thead>
            <tr className="bg-purple-600 text-white">
              <th className="p-3 text-left text-sm font-medium">ID</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Age</th>
              <th className="p-3 text-left text-sm font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="p-3 text-center text-sm text-gray-500"
                >
                  No results found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3 text-sm text-gray-600">{item.id}</td>
                  <td className="p-3 text-sm text-gray-600">{item.Name}</td>
                  <td className="p-3 text-sm text-gray-600">{item.age}</td>
                  <td className="p-3 text-sm text-gray-600">{item.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
export async function getServerSideProps() {
  // console.log(location.origin)
  const fetcher = await fetch("http://localhost:3000/api/homemaidlistprisma", {
    method: "get",
  });
  const waiter = await fetcher.json();
  return { props: { waiter } };
}
