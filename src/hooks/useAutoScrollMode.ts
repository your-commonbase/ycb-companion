import { useEffect, useState } from 'react';

export function useAutoScrollMode() {
  const [autoScrollMode, setAutoScrollMode] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Load setting from localStorage on client side
    const savedAutoScrollMode = localStorage.getItem('autoScrollMode');
    setAutoScrollMode(savedAutoScrollMode === 'true');
    setIsLoaded(true);
  }, []);

  const toggleAutoScrollMode = (enabled?: boolean) => {
    const newValue = enabled !== undefined ? enabled : !autoScrollMode;
    setAutoScrollMode(newValue);
    localStorage.setItem('autoScrollMode', newValue.toString());
  };

  return {
    autoScrollMode,
    isLoaded,
    toggleAutoScrollMode,
  };
}
