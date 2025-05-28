'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { MobileNav } from '@/components/updated/MobileNav';
import { ProfileMenu } from '@/components/updated/ProfileMenu';
import type { SliderItem } from '@/components/updated/Slider';
import { Slider } from '@/components/updated/Slider';
import { AppConfig } from '@/utils/AppConfig';

const navigationItems: SliderItem[] = [
  { id: 'store', label: 'Store', href: '/dashboard/store' },
  { id: 'search', label: 'Search', href: '/dashboard/search' },
  { id: 'synthesize', label: 'Synthesize', href: '/dashboard/synthesize' },
  { id: 'share', label: 'Share', href: '/dashboard/share' },
];

const BaseTemplate = ({ children }: { children: React.ReactNode }) => {
  const [profilePicture, setProfilePicture] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch('/api/getProfilePicture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setProfilePicture(data.data.profilePicture.text);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };

    fetchProfilePicture();
  }, []);

  return (
    <div className="w-full bg-[#f5f5f5] antialiased">
      <div>
        <header className="flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-3 p-4">
            {profilePicture ? (
              <ProfileMenu profilePicture={profilePicture} />
            ) : (
              <img
                src="/logomark.svg"
                className="inline-block"
                width={28}
                height={28}
                alt="logomark"
              />
            )}
            <div className="flex flex-col">
              <div className="font-besley text-2xl font-bold tracking-tight">
                yCB
              </div>
              &lt;companion&gt;
            </div>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <Slider
              items={navigationItems}
              selectedId={pathname.split('/').pop() || ''}
              showLinks
            />
          </div>
          {/* Mobile Navigation */}
          <div className="flex flex-1 justify-end lg:hidden">
            <MobileNav items={navigationItems} />
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-gray-300 py-8 text-center text-sm">
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://www.icloud.com/shortcuts/e5b66464cff943f286244b06ab79625b"
          >
            Get the iOS shortcut.
          </a>
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://github.com/bramses/simple-chrome-ycb"
          >
            {' '}
            Get the Chrome Extension.
          </a>
          <a
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
            href="https://forms.gle/e4MPYNiRDCBixi9j8"
          >
            {' '}
            Feedback.
          </a>
          © Copyright {new Date().getFullYear()} {AppConfig.name}. Boilerplate
          created by{' '}
          <a
            href="https://creativedesignsguru.com"
            className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          >
            CreativeDesignsGuru
          </a>
          .
        </footer>
      </div>
    </div>
  );
};

export { BaseTemplate };
