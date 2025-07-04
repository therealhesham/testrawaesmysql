

import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import prisma from "pages/api/globalprisma";
interface Homemaid {
  id: number;
  Name: string;
  Picture?: { url: string } | null;
  displayOrder: number;
}

interface ManageHomemaidsProps {
  initialHomemaids: Homemaid[];
}

export default function ManageHomemaids({ initialHomemaids }: ManageHomemaidsProps) {
  const [homemaids, setHomemaids] = useState<Homemaid[]>(initialHomemaids);
  const router = useRouter();
  let draggedItemId: number | null = null;

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: number) => {
    draggedItemId = id;
    e.currentTarget.classList.add("opacity-50", "scale-105");
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault(); // Allow drop
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

    setHomemaids(updatedHomemaids); // Optimistic update

    // Update database
    try {
      const response = await fetch("/api/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homemaids: updatedHomemaids }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }
      toast.success("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order. Please try again.");
      setHomemaids(initialHomemaids); // Revert on error
    }

    draggedItemId = null;
    e.currentTarget.classList.remove(...["opacity-50", "scale-105"]);
  };

  // Handle keyboard reordering
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, homemaid: Homemaid, index: number) => {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      const newHomemaids = [...homemaids];
      [newHomemaids[index], newHomemaids[index - 1]] = [newHomemaids[index - 1], newHomemaids[index]];
      const updatedHomemaids = newHomemaids.map((h, i) => ({ ...h, displayOrder: i }));
      setHomemaids(updatedHomemaids);
      updateDatabase(updatedHomemaids);
    } else if (e.key === "ArrowDown" && index < homemaids.length - 1) {
      e.preventDefault();
      const newHomemaids = [...homemaids];
      [newHomemaids[index], newHomemaids[index + 1]] = [newHomemaids[index + 1], newHomemaids[index]];
      const updatedHomemaids = newHomemaids.map((h, i) => ({ ...h, displayOrder: i }));
      setHomemaids(updatedHomemaids);
      updateDatabase(updatedHomemaids);
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
      toast.success("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order. Please try again.");
      setHomemaids(initialHomemaids); // Revert on error
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Manage Homemaids Order
      </h1>
      <ul className="min-h-[200px] p-2 rounded-lg bg-gray-50">
        {homemaids.map((homemaid, index) => (
          <li
            key={homemaid.id}
            draggable
            onDragStart={(e) => handleDragStart(e, homemaid.id)}
            onDragOver={handleDragOver}
            onDragEnd={(e) => e.currentTarget.classList.remove(...["opacity-50", "scale-105"])}
            onDrop={(e) => handleDrop(e, homemaid.id)}
            onKeyDown={(e) => handleKeyDown(e, homemaid, index)}
            tabIndex={0}
            className="p-4 mb-2 rounded-lg shadow-sm flex items-center bg-white hover:bg-gray-100 transition-all duration-200 cursor-move select-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Drag or move ${homemaid.Name} to reorder`}
          >
            {homemaid.Picture?.url ? (
              <img
                src={homemaid.Picture.url}
                alt={homemaid.Name}
                className="w-16 h-16 mr-4 object-cover rounded-md"
                onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
              />
            ) : (
              <div className="w-16 h-16 mr-4 bg-gray-200 rounded-md flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="flex-1">
              <span className="font-semibold text-gray-800">{homemaid.Name}</span>
              <span className="ml-2 text-sm text-gray-500">
                (Order: {homemaid.displayOrder})
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps() {
  const homemaids = await prisma.homemaid.findMany({
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      Name: true,
      Picture: true,
      displayOrder: true,
    },
  });
  return { props: { initialHomemaids: homemaids } };
}