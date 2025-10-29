import React, { useState, useEffect, useRef } from 'react';

const PersistentCountdownTimer = ({ 
  initialMinutes = 10, 
  onExpire, 
  onReset, 
  isActive = true, 
  showWarning = true, 
  position = "fixed", 
  startTime = null,
  storageKey = "countdown_timer",
  resetTrigger = 0 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isWarning, setIsWarning] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const intervalRef = useRef(null);
  const componentMountedRef = useRef(true);
  
  const TOTAL_TIME = initialMinutes * 60;
  const WARNING_TIME = 2 * 60;

  // Function to completely stop and clear timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Function to reset timer to full duration
  const resetTimerToFull = (reason = 'manual') => {
    console.log(`Timer reset to full duration - reason: ${reason}`);
    
    stopTimer();
    
    const newStartTime = Date.now();
    const timerData = {
      startTime: newStartTime,
      totalTime: TOTAL_TIME,
      resetCount: (resetTrigger || 0) + 1,
      lastUpdate: newStartTime,
      resetReason: reason,
      wasNavigatedAway: false,
      isActive: true,
      pageUrl: window.location.pathname // Track current page
    };
    
    localStorage.setItem(storageKey, JSON.stringify(timerData));
    setTimeLeft(TOTAL_TIME);
    setIsWarning(false);
    
    if (reason.includes('navigation') && onReset) {
      onReset(reason);
    }
  };

  // Function to mark timer as navigated away (only for actual navigation, not reload)
  const markNavigatedAway = () => {
    console.log('Marking timer as navigated away');
    stopTimer();
    
    try {
      const savedTimer = localStorage.getItem(storageKey);
      if (savedTimer) {
        const timerData = JSON.parse(savedTimer);
        timerData.wasNavigatedAway = true;
        timerData.isActive = false;
        timerData.navigationTime = Date.now();
        timerData.lastPageUrl = timerData.pageUrl; // Store the page we're leaving
        localStorage.setItem(storageKey, JSON.stringify(timerData));
      }
    } catch (error) {
      console.error('Error marking navigation:', error);
    }
  };

  // Check if this is the same page (reload) or different page (navigation)
  const isSamePage = (savedPageUrl) => {
    const currentUrl = window.location.pathname;
    return savedPageUrl === currentUrl;
  };

  // Initialize timer
  useEffect(() => {
    if (!isActive) return;

    componentMountedRef.current = true;

    // Check if timer should be reset due to user interaction
    if (resetTrigger > 0) {
      console.log('Timer reset due to user interaction');
      resetTimerToFull('user_interaction');
      return;
    }
    
    let initialTimeLeft;
    
    if (startTime) {
      // Use provided start time (for continuing existing session)
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      initialTimeLeft = Math.max(0, TOTAL_TIME - elapsed);
      console.log('Timer initialization with provided startTime:', {
        startTime: new Date(startTime),
        elapsed: elapsed + 's',
        remaining: initialTimeLeft + 's'
      });
    } else {
      // Check localStorage
      try {
        const savedTimer = localStorage.getItem(storageKey);
        if (savedTimer) {
          const timerData = JSON.parse(savedTimer);
          const currentPageUrl = window.location.pathname;
          
          // Check if user navigated to a different page and came back
          if (timerData.wasNavigatedAway && !isSamePage(timerData.pageUrl)) {
            console.log('User returned from different page - starting fresh timer');
            initialTimeLeft = TOTAL_TIME;
            resetTimerToFull('return_from_different_page');
            return;
          }
          
          // If this is the same page (reload or tab switch), continue timer
          if (isSamePage(timerData.pageUrl) || !timerData.wasNavigatedAway) {
            const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000);
            initialTimeLeft = Math.max(0, TOTAL_TIME - elapsed);
            
            console.log('Same page detected - continuing timer:', {
              elapsed: elapsed + 's',
              remaining: initialTimeLeft + 's',
              wasNavigatedAway: timerData.wasNavigatedAway
            });
            
            // If too much time has passed, expire
            if (initialTimeLeft <= 0) {
              console.log('Timer expired during absence');
              if (onExpire) onExpire();
              return;
            }
            
            // Update timer data to mark as active again
            timerData.wasNavigatedAway = false;
            timerData.isActive = true;
            timerData.pageUrl = currentPageUrl;
            localStorage.setItem(storageKey, JSON.stringify(timerData));
          } else {
            // Different page, start fresh
            console.log('Different page detected - starting fresh');
            initialTimeLeft = TOTAL_TIME;
            resetTimerToFull('different_page');
            return;
          }
        } else {
          console.log('No saved timer found - starting fresh');
          initialTimeLeft = TOTAL_TIME;
        }
      } catch (error) {
        console.error('Error reading timer from localStorage:', error);
        initialTimeLeft = TOTAL_TIME;
      }
    }

    setTimeLeft(initialTimeLeft);

    // Save current timer state with page URL
    const timerData = {
      startTime: startTime || (Date.now() - (TOTAL_TIME - initialTimeLeft) * 1000),
      totalTime: TOTAL_TIME,
      resetCount: resetTrigger,
      wasNavigatedAway: false,
      isActive: true,
      lastUpdate: Date.now(),
      pageUrl: window.location.pathname
    };
    localStorage.setItem(storageKey, JSON.stringify(timerData));

  }, [isActive, startTime, storageKey, TOTAL_TIME, onExpire, resetTrigger]);

  // Main countdown effect
  useEffect(() => {
    if (!isActive || timeLeft <= 0 || !isPageVisible || !componentMountedRef.current) {
      stopTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!componentMountedRef.current) {
        stopTimer();
        return;
      }

      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        
        // Update localStorage with current state
        try {
          const savedTimer = localStorage.getItem(storageKey);
          if (savedTimer && componentMountedRef.current) {
            const timerData = JSON.parse(savedTimer);
            timerData.lastUpdate = Date.now();
            timerData.isActive = true;
            timerData.wasNavigatedAway = false;
            timerData.pageUrl = window.location.pathname;
            
            // Update startTime to reflect current position
            timerData.startTime = Date.now() - (TOTAL_TIME - newTime) * 1000;
            localStorage.setItem(storageKey, JSON.stringify(timerData));
          }
        } catch (error) {
          console.error('Error updating timer in localStorage:', error);
        }

        // Check for warning state
        if (showWarning && newTime <= WARNING_TIME && newTime > 0) {
          setIsWarning(true);
        }

        // Check for expiration
        if (newTime <= 0) {
          console.log('Timer expired');
          stopTimer();
          localStorage.removeItem(storageKey);
          if (onExpire && componentMountedRef.current) onExpire();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      stopTimer();
    };
  }, [isActive, timeLeft, showWarning, WARNING_TIME, storageKey, onExpire, isPageVisible]);

  // Handle page visibility changes (tab switching, minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isActive || !componentMountedRef.current) return;

      const pageIsVisible = !document.hidden;
      setIsPageVisible(pageIsVisible);

      if (!pageIsVisible) {
        console.log('Page hidden (tab switch/minimize) - pausing timer');
        stopTimer();
        // Don't mark as navigated away for visibility changes
      } else {
        console.log('Page visible again - resuming timer');
        // Timer will resume in the main countdown effect
      }
    };

    // Handle actual page navigation (beforeunload)
    const handleBeforeUnload = (e) => {
      console.log('Page unloading - marking as navigated away');
      componentMountedRef.current = false;
      stopTimer();
      
      // Only mark as navigated away if this is actual navigation
      // (not just a reload on the same page)
      const currentUrl = window.location.pathname;
      try {
        const savedTimer = localStorage.getItem(storageKey);
        if (savedTimer) {
          const timerData = JSON.parse(savedTimer);
          // Always mark as navigated away on beforeunload
          // The component will determine on next load if it's the same page
          timerData.wasNavigatedAway = true;
          timerData.isActive = false;
          timerData.navigationTime = Date.now();
          timerData.lastPageUrl = currentUrl;
          localStorage.setItem(storageKey, JSON.stringify(timerData));
        }
      } catch (error) {
        console.error('Error handling beforeunload:', error);
      }
    };

    // Handle page show (back button, forward button)
    const handlePageShow = (e) => {
      if (e.persisted) {
        console.log('Page restored from cache - checking timer state');
        // Page was restored from back/forward cache
        setTimeout(() => {
          if (componentMountedRef.current) {
            // Let the initialization effect handle this
            window.location.reload();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isActive, storageKey]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      console.log('Timer component unmounting');
      componentMountedRef.current = false;
      stopTimer();
      // Don't mark as navigated away on unmount - let beforeunload handle it
    };
  }, []);

  // Don't render if not active or time is up
  if (!isActive || timeLeft <= 0) {
    return null;
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (timeLeft / TOTAL_TIME) * 100;

  // Determine colors based on warning state
  const getTimerColors = () => {
    if (isWarning) {
      return {
        bg: 'bg-red-600',
        text: 'text-white',
        border: 'border-red-500',
        progress: 'bg-red-400'
      };
    }
    return {
      bg: 'bg-orange-600',
      text: 'text-white', 
      border: 'border-orange-500',
      progress: 'bg-orange-400'
    };
  };

  const colors = getTimerColors();

  const positionClasses = position === 'fixed' 
    ? 'fixed top-4 right-4 z-50' 
    : 'relative';

  return (
    <div className={`${positionClasses} ${colors.bg} ${colors.text} px-4 py-2 rounded-lg shadow-lg border-2 ${colors.border} min-w-[200px]`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <svg 
            className="w-4 h-4 mr-2" 
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
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        <span className="text-lg font-bold font-mono">{formatTime(timeLeft)}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 bg-opacity-30 rounded-full h-2">
        <div 
          className={`${colors.progress} h-2 rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {isWarning && (
        <div className="mt-2 text-xs text-center animate-pulse">
          ⚠️ Session expiring soon!
        </div>
      )}
    </div>
  );
};

export default PersistentCountdownTimer;