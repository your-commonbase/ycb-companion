import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface ProfileMenuProps {
  profilePicture: string;
}

export const ProfileMenu = ({ profilePicture }: ProfileMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    // Add sign out logic here
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="group relative size-20" ref={menuRef}>
      <button
        type="button"
        className="relative size-20 cursor-pointer"
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-controls="profile-menu"
      >
        <Image
          src={profilePicture}
          alt="profile"
          width={64}
          height={64}
          className="absolute inset-y-2 left-2.5 right-1.5 size-16 rounded-full"
        />
        <Image
          src="/profile-frame.svg"
          alt="profile frame"
          width={80}
          height={80}
          className="absolute inset-0 size-20"
        />
      </button>
      <div
        id="profile-menu"
        className={`absolute left-0 top-[calc(100%+8px)] z-50 w-24 transition-all duration-200 ease-in-out ${
          isMenuOpen
            ? 'visible opacity-100'
            : 'invisible opacity-0 lg:group-hover:visible lg:group-hover:opacity-100'
        }`}
      >
        <div className="flex flex-col gap-2 py-1">
          <Link
            href="/dashboard"
            onClick={() => setIsMenuOpen(false)}
            className="aspect-square w-full border border-black bg-[#f5f5f5] pl-1 hover:bg-black hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setIsMenuOpen(false)}
            className="aspect-square w-full border border-black bg-[#f5f5f5] pl-1 hover:bg-black hover:text-white"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex aspect-square w-full items-start justify-start border border-[#FF5152] bg-[#f5f5f5] pl-1 text-[#FF5152] hover:bg-[#FF5152] hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
