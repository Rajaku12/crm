import React, { Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Payments } from './Payments';

/**
 * Wrapper component for Payments to catch any errors
 * and prevent the entire app from crashing
 */
export const PaymentsWrapper: React.FC = () => {
    return (
        <ErrorBoundary>
            <Suspense fallback={
                <div className="p-6">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                        <span className="ml-4 text-gray-600">Loading Payments...</span>
                    </div>
                </div>
            }>
                <Payments />
            </Suspense>
        </ErrorBoundary>
    );
};

