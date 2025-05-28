'use client';

import { useState, useRef } from 'react';

interface ImageEntryProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

const ImageEntry = ({ onImageSelect, disabled = false }: ImageEntryProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onImageSelect(file);

    // Cleanup preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-64 w-full flex-col items-center justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div
        onClick={handleClick}
        className={`flex cursor-pointer flex-col items-center ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="mb-2 max-h-48 object-contain"
            />
            <p className="text-sm text-gray-500">{fileName}</p>
          </>
        ) : (
          <div className="flex aspect-square w-48 flex-col items-center justify-center border-2 border-dotted border-gray-300 p-4 text-center">
            <p>Click to upload an image</p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEntry; 