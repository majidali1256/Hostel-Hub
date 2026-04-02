
import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in"
          onClick={onClose}
        >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto animate-scale-in border border-gray-100 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;
