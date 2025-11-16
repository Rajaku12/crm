import React, { useEffect } from 'react';
import { CloseIcon } from '../icons/IconComponents';

interface ToastProps {
    message: string;
    onClose: () => void;
    type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'error' }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const toastColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-green-700' : 'hover:bg-red-700';

    return (
        <div 
            className={`fixed bottom-5 right-5 ${toastColor} text-white py-3 px-5 rounded-lg shadow-xl flex items-center justify-between animate-fade-in-up z-50`}
            role="alert"
            aria-live="assertive"
        >
            <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
            <span>{message}</span>
            <button onClick={onClose} className={`ml-4 p-1 rounded-full ${hoverColor} focus:outline-none focus:ring-2 focus:ring-white`}>
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>
    );
};