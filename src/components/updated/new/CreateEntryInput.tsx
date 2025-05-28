'use client';

import { useState } from 'react';

import TextEntry from './TextEntry';
import ImageEntry from './ImageEntry';
import URLEntry from './URLEntry';
import { authedFetch } from '@/utils/authedFetch';

// Types
export type EntryType = 'text' | 'image' | 'url' | 'qr';

interface EntryMetadata {
  author: string;
  title: string;
  type?: EntryType;
}

interface CreateEntryInputProps {
  onEntryAdded?: () => void;
  defaultMetadata?: Partial<EntryMetadata>;
}

// Component
const CreateEntryInput = ({ 
  onEntryAdded,
  defaultMetadata = {
    author: 'https://yourcommonbase.com/dashboard',
    title: '',
  }
}: CreateEntryInputProps) => {
  const [entryType, setEntryType] = useState<EntryType>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [metadata, setMetadata] = useState<EntryMetadata>({
    author: defaultMetadata.author || 'https://yourcommonbase.com/dashboard',
    title: defaultMetadata.title || '',
    type: 'text'
  });

  const handleAdd = async (data: string, argMetadata: Record<string, string> = {}) => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo({ status: 'loading', message: 'Adding entry...' });

      // Process metadata similar to current implementation
      const processedMetadata: Record<string, string> = {};
      for (const field of Object.keys(argMetadata)) {
        if (argMetadata[field] !== undefined) {
          processedMetadata[field] = argMetadata[field]!;
        }
      }

      const response = await authedFetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          metadata: {
            ...metadata,
            ...processedMetadata,
            type: entryType
          },
        }),
      });

      const responseData = await response.json();
      setDebugInfo({ status: 'success', data: responseData });

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add entry');
      }

      if (responseData.respData) {
        onEntryAdded?.();
        // Reset form after successful submission
        setContent('');
        setMetadata(prev => ({ ...prev, title: '' }));
      }

      return responseData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setDebugInfo({ status: 'error', error: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setDebugInfo({ status: 'loading', message: 'Processing image...' });

      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const worker = new Worker('/imageWorker.js');
        worker.postMessage({ 
          file: arrayBuffer, 
          apiKey: process.env.NEXT_PUBLIC_API_KEY_CF_IMG 
        });

        worker.onmessage = async (e) => {
          const { success, data, error } = e.data;
          if (success) {
            setDebugInfo({ status: 'processing', message: 'Image processed, adding entry...' });
            await handleAdd(data.data, {
              author: data.metadata.imageUrl,
              title: 'Image',
            });
          } else {
            const errorMessage = error || 'Failed to process image';
            setError(errorMessage);
            setDebugInfo({ status: 'error', error: errorMessage });
          }
          setLoading(false);
        };
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      setDebugInfo({ status: 'error', error: errorMessage });
      setLoading(false);
    }
  };

  const handleFetchURLMetadata = async (url: string) => {
    try {
      setDebugInfo({ status: 'loading', message: 'Fetching URL metadata...' });
      const response = await authedFetch(`/api/get-title?url=${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setDebugInfo({ status: 'success', data });

      if (data.title) {
        setContent(data.description ? `${data.description} | ${data.title}` : data.title);
        setMetadata(prev => ({ ...prev, title: data.title }));
      } else {
        throw new Error('No title found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch URL metadata';
      setError(errorMessage);
      setDebugInfo({ status: 'error', error: errorMessage });
      throw err;
    }
  };

  const renderContent = () => {
    switch (entryType) {
      case 'text':
        return (
          <TextEntry
            value={content}
            onChange={setContent}
            disabled={loading}
          />
        );
      case 'image':
        return (
          <ImageEntry
            onImageSelect={handleImageUpload}
            disabled={loading}
          />
        );
      case 'url':
        return (
          <URLEntry
            value={content}
            onChange={setContent}
            onFetchMetadata={handleFetchURLMetadata}
            disabled={loading}
          />
        );
      case 'qr':
        return (
          <div className="flex h-64 w-full items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="mb-2">ShareYCB Code Scanner</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full border border-black">
        {/* Header */}
        <div className="flex w-full flex-row border-b border-black">
          <div className="w-2/3 border-r border-dotted border-black px-4 py-3">
            {entryType === 'text' && (
              <input
                className="resize-none overflow-hidden border-none bg-transparent outline-none focus:outline-none focus:ring-0"
                placeholder="Click to edit title"
                value={metadata.title}
                onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              />
            )}
          </div>
          <div className="w-1/3 px-4 py-3 text-center">
            {new Date().toDateString()}
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}

        {/* Footer */}
        <div className="flex w-full flex-row border-t border-black">
          {/* Entry Type Selectors */}
          <div className="aspect-square w-1/5 border-r border-black p-6">
            <button
              type="button"
              onClick={() => setEntryType('text')}
              disabled={loading}
              className={`aspect-square ${
                entryType === 'text'
                  ? 'custom-button-selected'
                  : 'custom-button-unselected'
              }`}
            >
              <img
                src="/icons/text-icon-gray.svg"
                alt="text-entry"
                className="w-6"
              />
            </button>
          </div>
          <div className="aspect-square w-1/5 border-r border-black p-6">
            <button
              type="button"
              onClick={() => setEntryType('image')}
              disabled={loading}
              className={`aspect-square ${
                entryType === 'image'
                  ? 'custom-button-selected'
                  : 'custom-button-unselected'
              }`}
            >
              <img
                src="/icons/image-icon-gray.svg"
                alt="image-entry"
                className="w-6"
              />
            </button>
          </div>
          <div className="aspect-square w-1/5 border-r border-black p-6">
            <button
              type="button"
              onClick={() => setEntryType('url')}
              disabled={loading}
              className={`aspect-square ${
                entryType === 'url'
                  ? 'custom-button-selected'
                  : 'custom-button-unselected'
              }`}
            >
              <img
                src="/icons/link-icon-gray.svg"
                alt="url-entry"
                className="w-6"
              />
            </button>
          </div>
          <div className="aspect-square w-1/5 border-r border-black p-6">
            <button
              type="button"
              onClick={() => setEntryType('qr')}
              disabled={loading}
              className={`aspect-square ${
                entryType === 'qr'
                  ? 'custom-button-selected'
                  : 'custom-button-unselected'
              }`}
            >
              <img
                src="/icons/qr-icon-gray.svg"
                alt="qr-entry"
                className="w-6"
              />
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleAdd(content)}
            disabled={loading || !content.trim()}
            className="flex aspect-square w-1/5 items-center justify-center bg-black transition-colors disabled:opacity-50"
          >
            <img src="/icons/plus-icon-light.svg" alt="plus" className="w-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 text-red-500">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="w-full py-2 text-center">
            Adding entry...
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <h3 className="mb-2 font-semibold">Debug Info:</h3>
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </>
  );
};

export default CreateEntryInput; 