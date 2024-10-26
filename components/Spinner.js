import React from 'react';
import { Spinner } from 'react-bootstrap';

const OrdersLoading = () => {
  return (
    <div className="w-full space-y-6">
      {/* Loading header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="w-full border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b">
          <div className="grid grid-cols-7 gap-4 p-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Table body */}
        {[...Array(5)].map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0">
            <div className="grid grid-cols-7 gap-4 p-4">
              {[...Array(7)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Centered loading spinner */}
      <div className="flex justify-center items-center py-8">
        <Spinner className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    </div>
  );
};

export default OrdersLoading;