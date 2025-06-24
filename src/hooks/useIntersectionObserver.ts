import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  freezeOnceVisible = true,
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // If already been visible and freeze is enabled, don't re-observe
    if (freezeOnceVisible && hasBeenVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          const isVisible = entry.isIntersecting;
          setIsIntersecting(isVisible);

          if (isVisible && !hasBeenVisible) {
            setHasBeenVisible(true);
          }
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(target);

    // eslint-disable-next-line consistent-return
    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return {
    targetRef,
    isIntersecting,
    hasBeenVisible,
  };
}
