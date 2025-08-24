import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-md p-6 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 left-2 text-[#1f2937] text-xl" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}