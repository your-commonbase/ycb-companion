import Link from 'next/link';
import { useState } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedId?: string;
  defaultLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  itemClassName?: string;
  showLinks?: boolean;
  onSelect?: (id: string) => void;
}

export const Dropdown = ({
  items,
  selectedId,
  defaultLabel = 'Select',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  itemClassName = '',
  showLinks = false,
  onSelect,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedId);
  const displayLabel = selectedItem?.label || defaultLabel;

  const handleSelect = (item: DropdownItem) => {
    if (onSelect) {
      onSelect(item.id);
    }
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-14 w-full items-center justify-center rounded-full text-[#999999] ${
          isOpen
            ? 'bg-slider-track shadow-slider-track-shadow'
            : 'bg-slider-thumb shadow-slider-thumb-shadow'
        } ${buttonClassName}`}
      >
        <span className="mr-2">{displayLabel}</span>
        <svg
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl bg-slider-track p-2 shadow-slider-track-shadow ${menuClassName}`}
        >
          {items.map((item) => {
            const content = (
              <button
                type="button"
                key={item.id}
                className={`flex h-10 w-full cursor-pointer items-center rounded-full px-4 text-[#999999] transition-all ${
                  selectedId === item.id
                    ? 'bg-slider-thumb shadow-slider-thumb-shadow'
                    : 'hover:bg-slider-thumb hover:shadow-slider-thumb-shadow'
                } ${itemClassName}`}
                onClick={() => handleSelect(item)}
              >
                {item.label}
              </button>
            );

            if (showLinks && item.href) {
              return (
                <Link key={item.id} href={item.href} className="block">
                  {content}
                </Link>
              );
            }

            return content;
          })}
        </div>
      )}
    </div>
  );
};
