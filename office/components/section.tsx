import * as React from "react";

export default function SectionWithLabel() {
  return (
    <div className="relative bg-white p-6 m-6 border border-gray-300 rounded-lg shadow-md">
      <div className="absolute top-[-12px] left-4 bg-white px-3 text-lg font-semibold text-gray-700 border border-gray-300 rounded-lg">
        Section Label
      </div>
      <div className="mt-10">
        <p>This is the content of the section.</p>
      </div>
    </div>
  );
}
