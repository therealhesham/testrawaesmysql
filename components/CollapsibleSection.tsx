import { useState } from 'react';

export default function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-gray rounded-lg mb-2.5 shadow-md overflow-hidden">
      <div
        className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition"
        onClick={toggleSection}
      >
        <h3 className="text-lg font-semibold text-grayDark">{title}</h3>
        <div
          className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full fill-grayMedium">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}
      >
        <div className="p-5 pt-0">{children}</div>
      </div>
    </div>
  );
}