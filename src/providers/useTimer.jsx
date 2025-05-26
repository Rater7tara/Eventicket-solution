import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [onTimeExpired, setOnTimeExpired] = useState(null);

  const startTimer = useCallback((onExpiredCallback) => {
    // Only start a new timer if one isn't already running
    const existingEndTime = localStorage.getItem('seatTimerEndTime');
    
    if (!existingEndTime) {
      const endTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
      localStorage.setItem('seatTimerEndTime', endTime.toString());
      console.log('New timer started, end time:', new Date(endTime));
    } else {
      console.log('Existing timer found, resuming...');
    }
    
    setIsActive(true);
    if (onExpiredCallback) {
      setOnTimeExpired(() => onExpiredCallback);
    }
  }, []);

  const stopTimer = useCallback(() => {
    console.log('Timer stopped');
    setIsActive(false);
    setTimeLeft(0);
    localStorage.removeItem('seatTimerEndTime');
    setOnTimeExpired(null);
  }, []);

  const resetTimer = useCallback(() => {
    console.log('Timer reset');
    setIsActive(false);
    setTimeLeft(0);
    localStorage.removeItem('seatTimerEndTime');
    setOnTimeExpired(null);
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const updateCallback = useCallback((newCallback) => {
    setOnTimeExpired(() => newCallback);
  }, []);

  // Main timer effect
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        const endTime = localStorage.getItem('seatTimerEndTime');
        if (endTime) {
          const remaining = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
          
          console.log('Timer update - remaining seconds:', remaining);
          setTimeLeft(remaining);

          if (remaining <= 0) {
            console.log('Timer expired!');
            setIsActive(false);
            localStorage.removeItem('seatTimerEndTime');
            if (onTimeExpired) {
              onTimeExpired();
            }
          }
        } else {
          // No end time found, stop the timer
          setIsActive(false);
          setTimeLeft(0);
        }
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, onTimeExpired]);

  // Initialize timer on mount
  useEffect(() => {
    const endTime = localStorage.getItem('seatTimerEndTime');
    if (endTime) {
      const remaining = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
      console.log('Timer initialization - remaining seconds:', remaining);
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsActive(true);
      } else {
        localStorage.removeItem('seatTimerEndTime');
        setTimeLeft(0);
        setIsActive(false);
      }
    }
  }, []);

  return (
    <TimerContext.Provider value={{ 
      timeLeft, 
      isActive, 
      startTimer, 
      stopTimer, 
      resetTimer,
      formatTime, 
      updateCallback 
    }}>
      {children}
    </TimerContext.Provider>
  );
};