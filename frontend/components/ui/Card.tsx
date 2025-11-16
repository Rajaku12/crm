
import React from 'react';
import { FingerPrintIcon } from '../icons/IconComponents';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

interface FingerprintScannerProps {
    isOpen: boolean;
}

export const FingerprintScanner: React.FC<FingerprintScannerProps> = ({ isOpen }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex flex-col items-center justify-center transition-opacity duration-300">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
            <div className="relative flex items-center justify-center w-48 h-48">
                <div className="absolute w-full h-full bg-primary-500 rounded-full opacity-20 animate-ping"></div>
                <FingerPrintIcon className="w-24 h-24 text-white z-10" />
            </div>
            <p className="mt-8 text-2xl font-semibold text-white tracking-wider">Verifying Identity...</p>
        </div>
    );
};
