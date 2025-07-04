'use client';

import type { ChangeEvent, ClipboardEvent, DragEvent, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { fetchByID, updateEntry as apiUpdateEntry } from '@/helpers/functions';

interface UploaderProps {
  metadata: any;
  onUploadComplete?: (result: any) => void;
}

export default function ImageUploader({
  metadata,
  onUploadComplete,
}: UploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setResult] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(selectedFile: File | null) {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    handleFile(selected);
  }

  function resetUpload() {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((f) => f.type.startsWith('image/'));
    if (imageFile) {
      handleFile(imageFile);
    }
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const res = await fetch('/api/addImage', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      console.log('metadata:', metadata);
      if (metadata.parent_id) {
        const parent = await fetchByID(metadata.parent_id);
        let parentResMetadata = parent.metadata;
        try {
          parentResMetadata = parent.metadata;
        } catch (err) {
          console.error('Error parsing parent metadata:', err);
          return;
        }

        if (parentResMetadata.alias_ids) {
          parentResMetadata.alias_ids = [
            ...parentResMetadata.alias_ids,
            json.id,
          ];
        } else {
          parentResMetadata.alias_ids = [json.id];
        }

        await apiUpdateEntry(parent.id, parent.data, {
          ...parentResMetadata,
        });
      }

      setResult(json);

      // Reset the form after successful upload
      resetUpload();

      if (onUploadComplete) {
        onUploadComplete(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Handle clipboard paste from button click
  const handleClipboardPaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            // eslint-disable-next-line no-await-in-loop
            const blob = await clipboardItem.getType(type);
            const ifile = new File([blob], 'pasted-image.png', { type });
            handleFile(ifile);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  // Add paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));

      if (imageItem) {
        const ifile = imageItem.getAsFile();
        if (ifile) {
          handleFile(ifile);
        }
      }
    };

    const handleGlobalPaste = (e: Event) => {
      // Only handle paste if this component is focused or no other input is focused
      const { activeElement } = document;
      if (
        !activeElement ||
        (activeElement.tagName !== 'INPUT' &&
          activeElement.tagName !== 'TEXTAREA')
      ) {
        handlePaste(e as unknown as ClipboardEvent);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-4">
      {/* Drag and Drop Zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="space-y-3">
            <img
              src={preview}
              alt="preview"
              className="mx-auto max-h-48 max-w-full rounded object-contain"
            />
            <button
              type="button"
              onClick={resetUpload}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">
                Drag and drop an image here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                You can also{' '}
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  paste an image from your clipboard
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="submit"
        disabled={!file || loading}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </button>
    </form>
  );
}
