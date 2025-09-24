import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface OrderTimerProps {
  startTime: number;
}

const OrderTimer: React.FC<OrderTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(Date.now() - startTime);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  const timerString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const getTimerColor = () => {
    if (minutes >= 20) return 'bg-red-500 text-white';
    if (minutes >= 10) return 'bg-yellow-400 text-black';
    return 'bg-white text-brand-secondary';
  };

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-lg font-bold ${getTimerColor()}`}>
      <Clock size={20} />
      <span>{timerString}</span>
    </div>
  );
};

export default OrderTimer;
