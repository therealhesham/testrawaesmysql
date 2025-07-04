import { useState } from "react";
import { useRouter } from "next/router";
import prisma from "pages/api/globalprisma";
import Layout from "example/containers/Layout";

interface Homemaid {
  id: number;
  Name: string;
  Picture?: { url: string } | null;
  displayOrder: number;
  office?: { Country: string } | null;
}

interface ManageHomemaidsProps {
  initialHomemaids: Homemaid[];
}

export default function ManageHomemaids({ initialHomemaids }: ManageHomemaidsProps) {
  const [homemaids, setHomemaids] = useState<Homemaid[]>(initialHomemaids);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const router = useRouter();
  let draggedItemId: number | null = null;

  // Get unique countries from homemaids
  const countries = Array.from(
    new Set(homemaids.map((h) => h.office?.Country).filter((c): c is string => !!c))
  );

  // Handle country selection
  const handleCountrySort = async (country: string) => {
    setSelectedCountry(country);
    
    const sortedHomemaids = [...homemaids].sort((a, b) => {
      if (country === "") return a.displayOrder - b.displayOrder;
      
      const aCountry = a.office?.Country || "";
      const bCountry = b.office?.Country || "";
      
      if (aCountry === country && bCountry !== country) return -1;
      if (aCountry !== country && bCountry === country) return 1;
      return a.displayOrder - b.displayOrder;
    });

    // Update displayOrder
    const updatedHomemaids = sortedHomemaids.map((homemaid, index) => ({
      ...homemaid,
      displayOrder: index,
    }));

    setHomemaids(updatedHomemaids);
    await updateDatabase(updatedHomemaids);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: number) => {
    draggedItemId = id;
    e.currentTarget.classList.add("opacity-70", "scale-102");
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent<HTMLLIElement>, targetId: number) => {
    e.preventDefault();
    if (draggedItemId === null) return;

    const draggedItem = homemaids.find((h) => h.id === draggedItemId);
    if (!draggedItem) return;

    const reorderedHomemaids = homemaids.filter((h) => h.id !== draggedItemId);
    const targetIndex = homemaids.findIndex((h) => h.id === targetId);
    reorderedHomemaids.splice(targetIndex, 0, draggedItem);

    // Update displayOrder
    const updatedHomemaids = reorderedHomemaids.map((homemaid, index) => ({
      ...homemaid,
      displayOrder: index,
    }));

    setHomemaids(updatedHomemaids);
    await updateDatabase(updatedHomemaids);

    draggedItemId = null;
    e.currentTarget.classList.remove("opacity-70", "scale-102");
  };

  // Handle keyboard reordering
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLLIElement>, homemaid: Homemaid, index: number) => {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      const newHomemaids = [...homemaids];
      [newHomemaids[index], newHomemaids[index - 1]] = [newHomemaids[index - 1], newHomemaids[index]];
      const updatedHomemaids = newHomemaids.map((h, i) => ({ ...h, displayOrder: i }));
      setHomemaids(updatedHomemaids);
      await updateDatabase(updatedHomemaids);
    } else if (e.key === "ArrowDown" && index < homemaids.length - 1) {
      e.preventDefault();
      const newHomemaids = [...homemaids];
      [newHomemaids[index], newHomemaids[index + 1]] = [newHomemaids[index + 1], newHomemaids[index]];
      const updatedHomemaids = newHomemaids.map((h, i) => ({ ...h, displayOrder: i }));
      setHomemaids(updatedHomemaids);
      await updateDatabase(updatedHomemaids);
    }
  };

  // Update database function
  const updateDatabase = async (updatedHomemaids: Homemaid[]) => {
    try {
      const response = await fetch("/api/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homemaids: updatedHomemaids }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      setHomemaids(initialHomemaids);
    }
  };

  return (
    <Layout>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-gray-900 tracking-tight">
        Manage Homemaids
      </h1>
      
      {/* Country selection dropdown */}
      <div className="mb-8 flex items-center gap-4">
        <label htmlFor="country-select" className="text-lg font-medium text-gray-700">
          Filter by Country:
        </label>
        <select
          id="country-select"
          value={selectedCountry}
          onChange={(e) => handleCountrySort(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <ul className="p-4 rounded-xl bg-white shadow-lg">
        {homemaids.map((homemaid, index) => (
          <li
            key={homemaid.id}
            draggable
            onDragStart={(e) => handleDragStart(e, homemaid.id)}
            onDragOver={handleDragOver}
            onDragEnd={(e) => e.currentTarget.classList.remove("opacity-70", "scale-102")}
            onDrop={(e) => handleDrop(e, homemaid.id)}
            onKeyDown={(e) => handleKeyDown(e, homemaid, index)}
            tabIndex={0}
            className="p-4 mb-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 cursor-move select-none shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`Drag or move ${homemaid.Name} to reorder`}
          >
            <div className="flex items-center gap-4">
              {homemaid.Picture?.url ? (
                <img
                  src={homemaid.Picture.url}
                  alt={homemaid.Name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                  <span className="text-gray-500 text-sm font-medium">No Image</span>
                </div>
              )}
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg text-gray-900">{homemaid.Name}</span>
                  <span className="text-sm text-gray-500">Order: {homemaid.displayOrder}</span>
                </div>
                <span className="text-sm text-gray-600 mt-1">{homemaid?.office?.Country || 'No Country'}</span>
                <span className="text-sm text-gray-500">ID: {homemaid?.id}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const homemaids = await prisma.homemaid.findMany({
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      Name: true,
      office: true,
      Picture: true,
      displayOrder: true,
    },
  });

  return { props: { initialHomemaids: homemaids } };
}