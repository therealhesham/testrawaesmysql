import { CheckCircleIcon, XIcon } from '@heroicons/react/outline';
import { useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
// import { CheckCircleIcon, FaExclamationTriangle, XIcon } from 'react-icons/fa';
// CheckCircleIcon
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function AlertModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  autoClose = false,
  autoCloseDelay = 3000
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'error':
        return <FaExclamationTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <FaExclamationTriangle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <FaExclamationTriangle className="h-6 w-6 text-blue-600" />;
      default:
        return <FaExclamationTriangle className="h-6 w-6 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`relative bg-white border-2 rounded-lg shadow-lg max-w-md w-full mx-4 ${getBackgroundColor()}`}>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <XIcon className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${getTextColor()}`}>
                {title}
              </h3>
              <p className={`text-sm ${getTextColor()}`}>
                {message}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === 'success' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : type === 'error'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : type === 'warning'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              موافق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
