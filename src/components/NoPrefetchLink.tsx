'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';

// Component that completely disables prefetching
export function NoPrefetchLink({
  href,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  useEffect(() => {
    // Disable prefetching globally when this component mounts
    const links = document.querySelectorAll('link[rel="prefetch"]');
    links.forEach((link) => link.remove());
  }, []);

  return (
    <Link
      href={href}
      prefetch={false}
      {...props}
      onMouseEnter={(e) => {
        // Prevent any prefetch on hover
        e.preventDefault();
        props.onMouseEnter?.(e);
      }}
    >
      {children}
    </Link>
  );
}

// Button that navigates without using Next.js router (no prefetch)
export function NavigateButton({
  href,
  children,
  className = '',
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      // eslint-disable-next-line
      onClick={() => (window.location.href = href)}
      className={className}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
