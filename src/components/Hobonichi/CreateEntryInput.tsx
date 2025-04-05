'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EntryType = 'text' | 'image' | 'url' | 'qr';

const CreateEntryInput = () => {
  const router = useRouter();
  const [textAreaValue, setTextAreaValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY_CF_IMG;

  const add = async (
    data: string,
    argMetadata: Record<string, string> = {
      author: '',
      title: '',
    },
  ) => {
    setLoading(true);
    const metadata: Record<string, string> = {};
    console.log('argMetadata:', argMetadata);
    for (const field of Object.keys(argMetadata)) {
      if (argMetadata[field] !== undefined) {
        metadata[field] = argMetadata[field]!;
      }
    }

    const response = await fetch('/api/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        metadata,
      }),
    });
    const responseData = await response.json();
    setLoading(false);

    if (responseData.respData) {
      router.push(`/dashboard/entry/${responseData.respData.id}`);
    }
    return responseData;
  };

  const uploadImage = async () => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      setLoading(true);

      const worker = new Worker('/imageWorker.js');
      worker.postMessage({ file: arrayBuffer, apiKey });

      worker.onmessage = async (e) => {
        const { success, data, error } = e.data;
        if (success) {
          console.log('Image description:', data);
          const responseEntry = await add(data.data, {
            author: data.metadata.imageUrl,
            title: 'Image',
          });
          console.log('responseEntry:', responseEntry);
          if (responseEntry.respData) {
            router.push(`/dashboard/entry/${responseEntry.respData.id}`);
          }
        } else {
          console.error('Error:', error);
        }
        setLoading(false);
      };
    };
    reader.readAsArrayBuffer(imageFile);
  };

  const renderInput = () => {
    switch (entryType) {
      case 'text':
        return (
          <div className="w-full min-h-64">
          <textarea 
            className="w-full h-full p-4 resize-none overflow-hidden
              outline-none focus:outline-none
              border-none focus:ring-0
              bg-transparent"
            value={textAreaValue}
            onChange={(e) => setTextAreaValue(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const scrollPos = window.scrollY;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
              window.scrollTo(0, scrollPos);
            }}
            placeholder="Write your thoughts here..."
          />
          </div>
        );
      case 'image':
        return (
          <div className="w-full h-64 flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {imageFile ? (
                <>
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Selected image"
                    className="max-h-48 object-contain mb-2"
                  />
                  <p className="text-sm text-gray-500">{imageFile.name}</p>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                  <p>Click to upload an image</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        );
      case 'url':
        return (
          <div className="w-full min-h-64">
          <textarea 
            className="w-full h-full p-4 resize-none overflow-hidden
              outline-none focus:outline-none
              border-none focus:ring-0
              bg-transparent"
            value={textAreaValue}
            onChange={(e) => setTextAreaValue(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const scrollPos = window.scrollY;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
              window.scrollTo(0, scrollPos);
            }}
            placeholder="Enter a URL here..."
          />
          </div>
        );
      case 'qr':
        return (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="mb-2">ShareYCB Code Scanner</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
    <div className="w-full border border-black">
      <div className="w-full flex flex-row border-b border-black">
        <div className="w-1/3 border-r border-dotted border-black px-4 py-3">
          {new Date().toDateString()}
        </div>
        <div className="w-1/3 border-r border-dotted border-black px-4 py-3"></div>
      </div>
      {renderInput()}
      <div className="w-full flex flex-row border-t border-black">
        <div className="w-1/5 p-6 aspect-square border-r border-black">
          <button 
            onClick={() => {
              setEntryType('text');
              setImageFile(null);
            }} 
            className={entryType === 'text' ? 'custom-button-selected' : 'custom-button-unselected'}
          >
            <img src="/text-entry-icon.svg" alt="text-entry" className="w-6" />
          </button>
        </div>
        <div className="w-1/5 p-6 aspect-square border-r border-black">
          <button 
            onClick={() => {
              setEntryType('image');
              setTextAreaValue('');
            }} 
            className={entryType === 'image' ? 'custom-button-selected' : 'custom-button-unselected'}
          >
            <img src="/image-entry-icon.svg" alt="image-entry" className="w-6" />
          </button>
        </div>
        <div className="w-1/5 p-6 aspect-square border-r border-black">
          <button 
            onClick={() => {
              setEntryType('url');
              setImageFile(null);
            }} 
            className={entryType === 'url' ? 'custom-button-selected' : 'custom-button-unselected'}
          >
            <img src="/url-entry-icon.svg" alt="url-entry" className="w-6" />
          </button>
        </div>
        <div className="w-1/5 p-6 aspect-square border-r border-black">
          <button 
            onClick={() => {
              setEntryType('qr');
              setTextAreaValue('');
              setImageFile(null);
            }} 
            className={entryType === 'qr' ? 'custom-button-selected' : 'custom-button-unselected'}
          >
            <img src="/qr-entry-icon.svg" alt="qr-entry" className="w-6" />
          </button>
        </div>
        <button 
          onClick={async () => {
            if (entryType === 'image' && imageFile) {
              await uploadImage();
            } else if (textAreaValue.trim() !== '') {
              await add(textAreaValue, {
                author: 'https://yourcommonbase.com/dashboard',
                title: new Date().toDateString(),
                type: entryType,
              });
            }
          }}
          className="w-1/5 aspect-square bg-black flex items-center justify-center transition-colors"
        >
          <img src="/light-plus.svg" alt="plus" className="w-6" />
        </button>
      </div>
    </div>
    {loading && <div className="w-full text-center py-2">Adding entry...</div>}
    </>
  );
};

export default CreateEntryInput;
