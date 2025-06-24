import { useEffect, useRef, useState } from 'react';

interface DropdownItem {
  label: string;
  shortcut?: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface NavigationDropdownProps {
  title: string;
  items: DropdownItem[];
  icon?: React.ReactNode;
}

export default function NavigationDropdown({
  title,
  items,
  icon,
}: NavigationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <li className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isOpen) {
            setIsOpen(true);
          }
        }}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isOpen
            ? 'bg-blue-100 text-blue-900 shadow-sm'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span>{title}</span>
        </div>
        <svg
          className={`size-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 w-full min-w-[200px] origin-top rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 duration-200 animate-in fade-in-0 zoom-in-95"
        >
          {items.map((item: any) => (
            <button
              key={`${item.label}-dropdown-item`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              type="button"
              role="menuitem"
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                item.disabled
                  ? 'cursor-not-allowed text-gray-400'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:bg-gray-50 focus:text-gray-900 focus:outline-none'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="text-gray-400">{item.icon}</span>
                )}
                <span className={item.disabled ? 'line-through' : ''}>
                  {item.label}
                </span>
              </div>
              {item.shortcut && (
                <span className="font-mono text-xs text-gray-400">
                  [{item.shortcut}]
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
