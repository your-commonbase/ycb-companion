'use client';

import { useCallback, useRef } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useAPICache() {
  const pendingRequests = useRef(new Map<string, Promise<any>>());

  const getCachedOrFetch = useCallback(
    async (
      cacheKey: string,
      fetchFn: () => Promise<any>,
      ttl: number = CACHE_DURATION,
    ) => {
      const now = Date.now();
      const cached = cache.get(cacheKey);

      // Return cached data if still valid
      if (cached && now - cached.timestamp < ttl) {
        return cached.data;
      }

      // Check if request is already in flight
      const pending = pendingRequests.current.get(cacheKey);
      if (pending) {
        return pending;
      }

      // Start new request
      const promise = fetchFn();
      pendingRequests.current.set(cacheKey, promise);

      try {
        const data = await promise;
        cache.set(cacheKey, { data, timestamp: now });
        return data;
      } finally {
        pendingRequests.current.delete(cacheKey);
      }
    },
    [],
  );

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }, []);

  return { getCachedOrFetch, invalidateCache };
}
