'use client';

import { useEffect, useRef } from 'react';

interface TextEntryProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const TextEntry = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Write your thoughts here...',
}: TextEntryProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const scrollPos = window.scrollY;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    window.scrollTo(0, scrollPos);
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="min-h-64 w-full">
      <textarea
        ref={textareaRef}
        className="size-full resize-none overflow-hidden border-none bg-transparent p-4 outline-none focus:outline-none focus:ring-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};

export default TextEntry;
