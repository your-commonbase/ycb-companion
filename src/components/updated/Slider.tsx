import Link from 'next/link';

export interface SliderItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface SliderProps {
  items: SliderItem[];
  selectedId: string;
  onSelect?: (id: string) => void;
  className?: string;
  itemClassName?: string;
  showLinks?: boolean;
}

export const Slider = ({
  items,
  selectedId,
  onSelect,
  className = '',
  itemClassName = '',
  showLinks = false,
}: SliderProps) => {
  const handleClick = (item: SliderItem) => {
    if (onSelect) {
      onSelect(item.id);
    }
  };

  return (
    <div
      className={`slider-track mx-4 flex h-14 flex-row gap-4 rounded-full bg-slider-track p-2 shadow-slider-track-shadow ${className}`}
    >
      <div className="slider-thumb" data-selected={selectedId} />
      {items.map((item) => {
        const content = (
          <button
            key={item.id}
            type="button"
            className={`relative z-10 flex h-full w-40 cursor-pointer items-center justify-center rounded-full text-[#999999] ${itemClassName}`}
            onClick={() => handleClick(item)}
          >
            {item.label}
          </button>
        );

        if (showLinks && item.href) {
          return (
            <Link key={item.id} href={item.href} className="h-full w-40">
              {content}
            </Link>
          );
        }

        return content;
      })}
    </div>
  );
};
