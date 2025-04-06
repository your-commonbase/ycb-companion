'use client';

import { useState } from 'react';

type EntryType = 'text' | 'image' | 'url' | 'qr';

type Props = {
  onEntryAdded?: () => void;
};

const CreateEntryInput = ({ onEntryAdded }: Props) => {
  const [textAreaValue, setTextAreaValue] = useState('');
  const [titleAreaValue, setTitleAreaValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_API_KEY_CF_IMG;

  const resetInputs = () => {
    setTextAreaValue('');
    setTitleAreaValue('');
    setImageFile(null);
    setEntryType('text');
    
    // Reset textarea height
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
    });
  };

  const add = async (
    data: string,
    argMetadata: Record<string, string> = {
      author: '',
      title: '',
    },
  ) => {
    setLoading(true);
    const metadata: Record<string, string> = {};
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
      onEntryAdded?.();
      resetInputs();
    }
    return responseData;
  };

  const uploadImage = async (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      setLoading(true);

      const worker = new Worker('/imageWorker.js');
      worker.postMessage({ file: arrayBuffer, apiKey });

      worker.onmessage = async (e) => {
        const { success, data, error } = e.data;
        if (success) {
          const responseEntry = await add(data.data, {
            author: data.metadata.imageUrl,
            title: 'Image',
          });
          if (responseEntry.respData) {
            onEntryAdded?.();
          }
        } else {
          console.error('Error:', error);
        }
        setLoading(false);
      };
    };
    reader.readAsArrayBuffer(file);
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
            disabled={loading}
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
              disabled={loading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
              }}
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
                <div className="w-48 aspect-square border-2 border-dotted border-gray-300 p-4 text-center flex flex-col items-center justify-center">
                  <p>Click to upload an image</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
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
            disabled={loading}
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
        <div className="w-2/3 border-r border-dotted border-black px-4 py-3">
          {entryType === 'text' ? <input 
            className="resize-none overflow-hidden
              outline-none focus:outline-none
              border-none focus:ring-0
              bg-transparent"
            placeholder="Click to edit title"
            value={titleAreaValue}
            onChange={(e) => setTitleAreaValue(e.target.value)}
            /> : ''}
        </div>
        <div className="w-1/3 px-4 py-3 text-center">{new Date().toDateString()}</div>
      </div>
      {renderInput()}
      <div className="w-full flex flex-row border-t border-black">
        <div className="w-1/5 p-6 aspect-square border-r border-black">
          <button 
            onClick={() => {
              setEntryType('text');
              setImageFile(null);
            }} 
            disabled={loading}
            className={entryType === 'text' ? 'custom-button-selected aspect-square' : 'custom-button-unselected aspect-square'}
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
            disabled={loading}
            className={entryType === 'image' ? 'custom-button-selected aspect-square' : 'custom-button-unselected aspect-square'}
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
            disabled={loading}
            className={entryType === 'url' ? 'custom-button-selected aspect-square' : 'custom-button-unselected aspect-square'}
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
            disabled={loading}
            className={entryType === 'qr' ? 'custom-button-selected aspect-square' : 'custom-button-unselected aspect-square'}
          >
            <img src="/qr-entry-icon.svg" alt="qr-entry" className="w-6" />
          </button>
        </div>
        <button 
          onClick={async () => {
            if (loading) return;

            // Store the values we need before resetting
            const currentEntryType = entryType;
            const currentImageFile = imageFile;
            const currentTextValue = textAreaValue.trim();
            const currentTitleValue = titleAreaValue.trim();

            // Reset inputs immediately for better UX
            resetInputs();

            if (currentEntryType === 'image' && currentImageFile) {
              await uploadImage(currentImageFile);
            } else if (currentEntryType === 'url' && currentTextValue !== '') {
              try {
                const response = await fetch(`/api/get-title?url=${currentTextValue}`);
                const data = await response.json();

                if (data.title) {
                  await add(
                    data.description ? `${data.description} | ${data.title}` : data.title,
                    { author: currentTextValue, title: data.title }
                  );
                } else {
                  throw new Error('No title found');
                }
              } catch (err) {
                console.error('Unable to add URL entry. Please try again.');
              }
            } else if (currentTextValue !== '') {
              await add(currentTextValue, {
                author: 'https://yourcommonbase.com/dashboard',
                title: currentTitleValue || new Date().toDateString(),
                type: currentEntryType,
              });
            }
          }}
          className="w-1/5 aspect-square bg-black flex items-center justify-center transition-colors"
          disabled={loading}
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
