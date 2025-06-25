import { useEffect, useState } from 'react';

export function useAutoScrollMode() {
  const [autoScrollMode, setAutoScrollMode] = useState<boolean>(true);
  const [maxDepth, setMaxDepth] = useState<number>(8);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Load settings from localStorage on client side
    const savedAutoScrollMode = localStorage.getItem('autoScrollMode');
    const savedMaxDepth = localStorage.getItem('autoScrollMaxDepth');

    setAutoScrollMode(savedAutoScrollMode === 'true');
    setMaxDepth(savedMaxDepth ? parseInt(savedMaxDepth, 10) : 8);
    setIsLoaded(true);
  }, []);

  const toggleAutoScrollMode = (enabled?: boolean) => {
    const newValue = enabled !== undefined ? enabled : !autoScrollMode;
    setAutoScrollMode(newValue);
    localStorage.setItem('autoScrollMode', newValue.toString());
  };

  const updateMaxDepth = (depth: number) => {
    const validDepth = Math.max(1, Math.min(20, depth)); // Clamp between 1 and 20
    setMaxDepth(validDepth);
    localStorage.setItem('autoScrollMaxDepth', validDepth.toString());
  };

  return {
    autoScrollMode,
    maxDepth,
    isLoaded,
    toggleAutoScrollMode,
    updateMaxDepth,
  };
}
