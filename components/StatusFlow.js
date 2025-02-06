import React from 'react';

const StatusFlowProgress = ({ status }) => {
  if (!status) return null;

  const steps = [
    { key: 'order', label: `Order #${status.OrderNum || 'N/A'}`, status: status.OrderStatus },
    { key: 'delivery', label: `Delivery #${status.DeliveryNum || 'N/A'}`, status: status.DeliveryStatus },
    { key: 'invoice', label: `Invoice #${status.InvoiceNum || 'N/A'}`, status: status.InvoiceStatus },
    { key: 'payment', label: 'Payment', status: status.PaymentStatus }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'CLOSED':
      case 'Paid':
        return 'bg-green-500';
      case 'OPEN':
      case 'Partially Paid':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Order Status Flow</h2>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
          
          {/* Steps Container */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center">
                {/* Circle Indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(step.status)} text-white font-bold mb-2`}>
                  {index + 1}
                </div>
                {/* Label */}
                <div className="text-sm font-medium text-gray-700 text-center max-w-[120px]">
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusFlowProgress;