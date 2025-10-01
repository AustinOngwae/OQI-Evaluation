import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600"></div>
        <p className="text-gray-600 mt-4">Loading Application...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;