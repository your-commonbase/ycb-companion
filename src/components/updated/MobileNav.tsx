import { usePathname } from 'next/navigation';

import type { DropdownItem } from './Dropdown';
import { Dropdown } from './Dropdown';
import type { SliderItem } from './Slider';

interface MobileNavProps {
  items: SliderItem[];
}

export const MobileNav = ({ items }: MobileNavProps) => {
  const pathname = usePathname();
  const currentItem = pathname.split('/').pop() || '';

  const dropdownItems: DropdownItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
  }));

  return (
    <div className="mx-4 max-w-64 flex-1">
      <Dropdown
        items={dropdownItems}
        selectedId={currentItem}
        defaultLabel="Menu"
        showLinks
      />
    </div>
  );
};
