import { ExclamationCircleIcon } from '@heroicons/react/solid';

interface ErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ isOpen, title = "حدث خطأ", message, onClose }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <ExclamationCircleIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2 text-right">{title}</h3>
        <p className="text-gray-800 mb-6 text-right">{message}</p>
        <button
          type="button"
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={onClose}
        >
          موافق
        </button>
      </div>
    </div>
  );
}
