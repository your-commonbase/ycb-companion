'use client';

import { useState } from 'react';

interface URLEntryProps {
  value: string;
  onChange: (value: string) => void;
  onFetchMetadata: (url: string) => Promise<void>;
  disabled?: boolean;
}

const URLEntry = ({
  value,
  onChange,
  onFetchMetadata,
  disabled = false
}: URLEntryProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchMetadata = async () => {
    if (!value.trim()) return;
    
    try {
      setIsLoading(true);
      await onFetchMetadata(value);
    } catch (error) {
      console.error('Failed to fetch URL metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-64 w-full">
      <div className="flex w-full flex-col space-y-2 p-4">
        <textarea
          className="resize-none overflow-hidden border-none bg-transparent outline-none focus:outline-none focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter a URL here..."
        />
        <button
          type="button"
          onClick={handleFetchMetadata}
          disabled={disabled || isLoading || !value.trim()}
          className="ml-auto rounded-lg bg-gray-300 px-3 py-1 text-sm font-medium text-gray-900 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
        >
          {isLoading ? 'Fetching...' : 'Get Title'}
        </button>
      </div>
    </div>
  );
};

export default URLEntry; 