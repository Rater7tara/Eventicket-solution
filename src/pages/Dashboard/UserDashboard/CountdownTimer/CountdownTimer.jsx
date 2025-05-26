import React, { useState, useEffect, useRef } from 'react';

const CountdownTimer = ({ 
  initialMinutes = 5, 
  onExpire, 
  isActive = true, 
  showWarning = true,
  position = 'inline' // 'fixed' or 'inline'
}) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Reset timer when component becomes active
    if (isActive && !intervalRef.current) {
      setTimeLeft(initialMinutes * 60);
      lastUpdateRef.current = Date.now();
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdateRef.current) / 1000);
      
      if (elapsed >= 1) {
        setTimeLeft(prevTime => {
          const newTime = prevTime - elapsed;
          
          // Check for warning (last 60 seconds)
          if (newTime <= 60 && !isWarning && showWarning) {
            setIsWarning(true);
          }
          
          // Check if time expired
          if (newTime <= 0) {
            if (onExpire) {
              onExpire();
            }
            return 0;
          }
          
          return newTime;
        });
        
        lastUpdateRef.current = now;
      }
    }, 100); // Check every 100ms for smooth updates

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, initialMinutes, onExpire, isWarning, showWarning]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if not active
  if (!isActive || timeLeft <= 0) {
    return null;
  }

  const timerClasses = `
    ${position === 'fixed' ? 'fixed top-4 right-4 z-50' : 'inline-block'}
    bg-gradient-to-r ${isWarning ? 'from-red-600 to-red-700' : 'from-orange-600 to-orange-700'} 
    text-white px-4 py-2 rounded-lg shadow-lg border border-opacity-30 
    ${isWarning ? 'border-red-400 animate-pulse' : 'border-orange-400'}
    transition-all duration-300
  `;

  return (
    <div className={timerClasses}>
      <div className="flex items-center space-x-2">
        <svg 
          className={`w-4 h-4 ${isWarning ? 'text-red-200' : 'text-orange-200'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <span className="font-mono text-sm font-bold">
          {formatTime(timeLeft)}
        </span>
        {isWarning && (
          <span className="text-xs font-medium">
            Hurry!
          </span>
        )}
      </div>
      {position === 'fixed' && (
        <div className={`text-xs text-center mt-1 ${isWarning ? 'text-red-200' : 'text-orange-200'}`}>
          Session expires
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;