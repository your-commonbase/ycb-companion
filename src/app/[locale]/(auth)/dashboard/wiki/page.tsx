'use client';

import { useCallback, useEffect, useState } from 'react';

interface WikipediaData {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageUrl: string;
}

const WikiPage = () => {
  const [wikiData, setWikiData] = useState<WikipediaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedSentences, setAddedSentences] = useState<Set<string>>(new Set());
  const [addedImage, setAddedImage] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchWikipediaData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wikipedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Wikipedia data');
      }

      const data = await response.json();
      setWikiData(data.data);
      setAddedSentences(new Set());
      setAddedImage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const addSentenceToYCB = async (sentence: string) => {
    if (!wikiData || addedSentences.has(sentence)) return;

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: sentence,
          metadata: {
            title: wikiData.title,
            author: wikiData.pageUrl,
            type: 'text',
            source: 'wikipedia',
          },
        }),
      });

      if (response.ok) {
        setAddedSentences((prev) => new Set([...prev, sentence]));
        showSuccessToast('Sentence added to YCB!');
      } else {
        throw new Error('Failed to add sentence');
      }
    } catch (err) {
      showSuccessToast('Error adding sentence');
    }
  };

  const addImageToYCB = async () => {
    if (!wikiData?.thumbnail || addedImage) return;

    try {
      // Download the image from Wikipedia
      const imageResponse = await fetch(wikiData.thumbnail.source);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }

      const imageBlob = await imageResponse.blob();
      const imageUrl = new URL(wikiData.thumbnail.source);
      const filename =
        imageUrl.pathname.split('/').pop() || 'wikipedia-image.jpg';

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', imageBlob, filename);
      formData.append(
        'metadata',
        JSON.stringify({
          title: wikiData.title,
          author: wikiData.pageUrl,
          type: 'image',
          source: 'wikipedia',
        }),
      );

      const response = await fetch('/api/addImage', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setAddedImage(true);
        showSuccessToast('Image added to YCB!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add image');
      }
    } catch (err) {
      console.error('Error adding image:', err);
      showSuccessToast('Error adding image');
    }
  };

  const splitIntoSentences = (text: string): string[] => {
    // Common abbreviations that shouldn't end sentences
    const abbreviations = [
      'Mr.',
      'Mrs.',
      'Ms.',
      'Dr.',
      'Prof.',
      'Sr.',
      'Jr.',
      'St.',
      'Ave.',
      'Rd.',
      'Blvd.',
      'Ct.',
      'Ln.',
      'Pl.',
      'N.',
      'S.',
      'E.',
      'W.',
      'NE.',
      'NW.',
      'SE.',
      'SW.',
      'U.S.',
      'U.K.',
      'Inc.',
      'Ltd.',
      'Corp.',
      'Co.',
      'etc.',
      'vs.',
      'i.e.',
      'e.g.',
      'a.m.',
      'p.m.',
      'A.M.',
      'P.M.',
      'B.C.',
      'A.D.',
      'Ph.D.',
      'M.D.',
      'B.A.',
      'M.A.',
      'J.D.',
      'L.L.D.',
      'Rev.',
      'Gen.',
      'Col.',
      'Capt.',
      'Lt.',
      'Sgt.',
      'Pvt.',
      'No.',
      'Vol.',
      'Dept.',
      'Univ.',
      'Assn.',
      'Bros.',
      'Ste.',
      'Apt.',
      'Fl.',
      'Rm.',
      'Bldg.',
      'Mt.',
      'Ft.',
      'Pt.',
      'Is.',
    ];

    // First, normalize text by ensuring proper spacing after periods
    const normalizedText = text.replace(/\.([A-Z])/g, '. $1');

    // Then protect abbreviations by temporarily replacing them
    let protectedText = normalizedText;
    const replacements: { [key: string]: string } = {};

    abbreviations.forEach((abbr, index) => {
      const placeholder = `__ABBREV_${index}__`;
      const regex = new RegExp(abbr.replace('.', '\\.'), 'g');
      protectedText = protectedText.replace(regex, placeholder);
      replacements[placeholder] = abbr;
    });

    // Split on sentence-ending punctuation followed by space and capital letter
    const sentences = protectedText.split(/[.!?]+\s+(?=[A-Z])/);

    // Restore abbreviations and clean up
    return sentences
      .map((sentence) => {
        let restored = sentence.trim();

        // Restore abbreviations
        Object.entries(replacements).forEach(([placeholder, original]) => {
          restored = restored.replace(new RegExp(placeholder, 'g'), original);
        });

        // Add period if it doesn't end with punctuation
        if (!/[.!?]$/.test(restored)) {
          restored += '.';
        }

        return restored;
      })
      .filter((sentence) => sentence.length > 20) // Filter out very short fragments
      .filter((sentence) => {
        // Additional filter: make sure it's not just an abbreviation
        const words = sentence.replace(/[.!?]+$/, '').split(/\s+/);
        return words.length > 2; // Must have more than 2 words
      });
  };

  useEffect(() => {
    fetchWikipediaData();
  }, [fetchWikipediaData]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600">
            Fetching Wikipedia content...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={fetchWikipediaData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!wikiData) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center text-gray-500">
          <p>No Wikipedia data available</p>
        </div>
      </div>
    );
  }

  const sentences = splitIntoSentences(wikiData.extract);

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Wikipedia Explorer</h1>
        <button
          onClick={fetchWikipediaData}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="button"
        >
          Get Another Article
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-start gap-6">
          <div className="flex-1">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900">
              {wikiData.title}
            </h2>
            <a
              href={wikiData.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View on Wikipedia →
            </a>
          </div>

          {wikiData.thumbnail && (
            <div className="relative">
              <button
                onClick={addImageToYCB}
                disabled={addedImage}
                className={`h-48 w-auto overflow-hidden rounded-lg object-cover shadow-md transition-all duration-200 ${
                  addedImage
                    ? 'cursor-default opacity-50'
                    : 'cursor-pointer hover:scale-105 hover:shadow-lg'
                }`}
                type="button"
                aria-label={
                  addedImage ? 'Image already added to YCB' : 'Add image to YCB'
                }
              >
                <img
                  src={wikiData.thumbnail.source}
                  alt={wikiData.title}
                  className="size-full object-cover"
                />
              </button>
              {addedImage && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                  <div className="rounded-full bg-green-500 p-2">
                    <svg
                      className="size-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <div className="mt-2 text-center text-xs text-gray-500">
                {addedImage ? 'Added to YCB!' : 'Click to add image'}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Article Content</h3>
          <p className="mb-4 text-sm text-gray-600">
            Click on any sentence to add it to your YCB as an entry.
          </p>

          <div className="space-y-2">
            {sentences.map((sentence) => {
              const isAdded = addedSentences.has(sentence);
              return (
                <button
                  key={sentence}
                  className={`inline-block rounded px-2 py-1 text-left transition-all duration-200 ${
                    isAdded
                      ? 'cursor-default bg-green-100 text-green-800'
                      : 'hover:bg-blue-50 hover:text-blue-800'
                  }`}
                  onClick={() => addSentenceToYCB(sentence)}
                  disabled={isAdded}
                  type="button"
                  aria-label={
                    isAdded
                      ? 'Sentence already added to YCB'
                      : 'Add sentence to YCB'
                  }
                >
                  {sentence}
                  {isAdded && <span className="ml-1 text-green-600">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Added {addedSentences.size} sentence
              {addedSentences.size !== 1 ? 's' : ''}
              {addedImage && ' and 1 image'} to YCB
            </span>
            <span>Source: Wikipedia</span>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-6 py-4 text-white shadow-lg transition-all duration-300">
          <div className="flex items-center space-x-2">
            <svg
              className="size-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiPage;
