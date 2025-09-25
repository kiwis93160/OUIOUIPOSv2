export const getOrderUrgencyClass = (startTime?: number): string => {
  if (!startTime) {
    return 'bg-white border-gray-300';
  }

  const minutes = (Date.now() - startTime) / 60000;

  if (minutes > 15) {
    return 'bg-red-200 border-red-500';
  }

  if (minutes > 8) {
    return 'bg-yellow-200 border-yellow-500';
  }

  return 'bg-white border-gray-300';
};
