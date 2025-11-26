// src/components/LazyLoading.jsx
import React from 'react';

const LazyLoading = ({ status }) => {
    return (
        <div className="fixed inset-0 flex items-center h-screen justify-center bg-gray-900 z-50">
            <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                <p className="text-white text-lg font-semibold">{status}</p>
            </div>
        </div>
    );
};

export default LazyLoading;
