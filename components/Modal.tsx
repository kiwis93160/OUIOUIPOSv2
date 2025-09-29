
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 sm:px-6"
      onClick={onClose}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl ${sizeClasses[size]} max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-gray-500 transition-colors hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
