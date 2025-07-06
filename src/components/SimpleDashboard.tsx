/* eslint-disable no-underscore-dangle */

'use client';

import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import type { SearchClient } from 'instantsearch.js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';

import ImageUpload from '@/components/ImageUpload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { fetchRandomEntry } from '@/helpers/functions';

// Tab button component moved outside to avoid re-creation on render
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ label, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? 'border-b-2 border-black' : null
    }`}
    type="button"
    aria-pressed={isActive}
  >
    {label}
  </button>
);

// Search components for InstantSearch
const CustomSearchBox = ({ setSemanticSearchResults }: any) => {
  const { query, refine } = useSearchBox();

  return (
    <input
      id="dashboard-search"
      onChange={(e) => {
        try {
          refine(e.target.value);
        } catch (err) {
          console.error('Error refining search:', err);
        }
        setSemanticSearchResults();
      }}
      type="text"
      value={query}
      className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Search your entries..."
    />
  );
};

const CustomHits = ({ router, imageUrls }: any) => {
  const { items } = useHits();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
      <h4 className="text-sm font-medium text-gray-700">Instant Results:</h4>
      {items.map((item: any) => (
        <button
          key={item.id}
          className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
          onClick={() => router.push(`/dashboard/entry/${item.id}`)}
          type="button"
        >
          <div className="flex items-start space-x-3">
            {item.metadata?.type === 'image' && imageUrls[item.id] && (
              <img
                src={imageUrls[item.id]}
                alt="Entry preview"
                className="size-16 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              {/* eslint-disable-next-line */}
              <div
                className="line-clamp-3 text-sm text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: item._highlightResult?.data?.value || item.data,
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                {new Date(
                  item.createdAt || item.created_at,
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const SimpleDashboard = () => {
  const router = useRouter();

  // Store section state
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'url'>('text');
  const [textValue, setTextValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Search section state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageUrls, setImageUrls] = useState<{ [id: string]: string }>({});
  const [searchDebounceTimer, setSearchDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [searchHighlights, setSearchHighlights] = useState<{
    [id: string]: string;
  }>({});
  const [isSearchClient, setSearchClient] = useState<SearchClient | null>(null);

  // Synthesize section state
  const [randomEntry, setRandomEntry] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [recentComments, setRecentComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [logPollingTimer, setLogPollingTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [logImageUrls, setLogImageUrls] = useState<{ [id: string]: string }>(
    {},
  );

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Poll log for updates after entry additions
  const pollLogUpdates = () => {
    // Clear any existing timer
    if (logPollingTimer) {
      clearTimeout(logPollingTimer);
    }

    let attempts = 0;
    const maxAttempts = 15; // Poll for 15 seconds
    const currentLogLength = recentComments.length;
    const currentFirstEntryId = recentComments[0]?.id;

    const poll = async () => {
      try {
        const response = await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            limit: 20,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newLogData = data.data || [];
          const newLogLength = newLogData.length;
          const newFirstEntryId = newLogData[0]?.id;

          // Check if log has new entries (either length changed or first entry is different)
          // Also check if any URLs are still processing (contain "URL: ")
          const hasUnprocessedUrls = newLogData.some(
            (entry: any) => entry.data && entry.data.startsWith('URL: '),
          );

          const hasNewEntries =
            newLogLength > currentLogLength ||
            (newFirstEntryId && newFirstEntryId !== currentFirstEntryId);

          if (hasNewEntries && !hasUnprocessedUrls) {
            setRecentComments(newLogData);
            return; // Stop polling - we got new data and no URLs are processing
          }
          if (hasNewEntries) {
            setRecentComments(newLogData); // Update with new data but keep polling
          }
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          const timer = setTimeout(poll, 1000); // Poll every second
          setLogPollingTimer(timer);
        }
      } catch (error) {
        console.error('Error polling log updates:', error);
      }
    };

    // Start polling immediately
    poll();
  };

  // Upload functions
  const handleTextUpload = async () => {
    if (!textValue.trim()) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: textValue,
          metadata: {
            title: 'Thought',
            author: 'https://yourcommonbase.com/dashboard',
          },
        }),
      });

      if (response.ok) {
        await response.json();
        setTextValue('');
        // Start polling for log updates
        pollLogUpdates();
        // Show success toast
        setToastMessage('Text entry added successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error uploading text:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlValue.trim()) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/addURL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlValue,
          metadata: {},
        }),
      });

      if (response.ok) {
        await response.json();
        setUrlValue('');
        // Start polling for log updates
        pollLogUpdates();
        // Show success toast
        setToastMessage('URL entry added successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error uploading URL:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setImageUrls({});
      setSearchHighlights({});
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data || []);

        // Create highlights for search results
        const highlights: { [id: string]: string } = {};
        data.data.forEach((entry: any) => {
          if (entry.data) {
            // Simple highlighting - replace query matches with bold tags
            const regex = new RegExp(
              `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
              'gi',
            );
            highlights[entry.id] = entry.data.replace(
              regex,
              '<mark class="bg-yellow-200">$1</mark>',
            );
          }
        });
        setSearchHighlights(highlights);

        // Load images for image entries
        const imageEntries = data.data.filter(
          (entry: any) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          const imageIds = imageEntries.map((entry: any) => entry.id);
          const imageResponse = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: imageIds }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            setImageUrls(imageData.data.body.urls || {});
          }
        }
      }
    } catch (error) {
      // Error searching
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce

    setSearchDebounceTimer(newTimer);
  };

  // Load recent log entries function
  const loadRecentComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const logData = data.data || [];
        setRecentComments(logData);

        // Load images for image entries in log
        const imageEntries = logData.filter(
          (entry: any) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          const imageIds = imageEntries.map((entry: any) => entry.id);
          const imageResponse = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: imageIds }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            setLogImageUrls(imageData.data.body.urls || {});
          }
        }
      }
    } catch (error) {
      console.error('Error fetching log entries:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Random entry function
  const loadRandomEntry = async () => {
    try {
      const entry = await fetchRandomEntry();
      setRandomEntry(entry);
    } catch (error) {
      console.error('Error fetching random entry:', error);
    }
  };

  // Add comment function
  const handleAddComment = async () => {
    if (!commentText.trim() || !randomEntry) return;

    setIsAddingComment(true);
    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: commentText,
          metadata: {
            parent_id: randomEntry.id,
            title: randomEntry.metadata?.title || 'Comment',
            author:
              randomEntry.metadata?.author ||
              'https://yourcommonbase.com/dashboard',
          },
        }),
      });

      if (response.ok) {
        await response.json();
        setCommentText('');
        // Start polling for log updates
        pollLogUpdates();
        // Show success toast
        setToastMessage('Comment added successfully!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  // Initialize MeiliSearch client
  const initializeSearchClient = async () => {
    try {
      const token = await fetch('/api/searchToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const tokenData = await token.json();

      if (tokenData.error) {
        if (tokenData.error.includes('upgrade to search or synthesis plan')) {
          return; // No search client available
        }
        throw new Error(tokenData.error);
      }

      if (Object.keys(tokenData).length === 0) {
        throw new Error('No token data returned from the API');
      }

      const { searchClient } = instantMeiliSearch(
        process.env.NEXT_PUBLIC_MEILI_HOST!,
        tokenData.token.token,
        {
          placeholderSearch: true,
        },
      );

      setSearchClient(searchClient);
    } catch (err) {
      console.error('Error initializing search client:', err);
    }
  };

  // Load random entry and recent comments on mount
  useEffect(() => {
    loadRandomEntry();
    loadRecentComments();
    initializeSearchClient();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
      if (logPollingTimer) {
        clearTimeout(logPollingTimer);
      }
    };
  }, [searchDebounceTimer, logPollingTimer]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Search Section */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Find content in your knowledge base</CardDescription>
        </CardHeader>
        <CardContent>
          {isSearchClient ? (
            <InstantSearch
              searchClient={isSearchClient}
              indexName="ycb_fts_staging"
            >
              <CustomSearchBox
                setSemanticSearchResults={() => setSearchResults([])}
              />
              <CustomHits router={router} imageUrls={imageUrls} />

              {/* Semantic Search Button */}
              <div className="mt-4">
                <button
                  type="button"
                  className="w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
                  onClick={async () => {
                    const input = document.getElementById(
                      'dashboard-search',
                    ) as HTMLInputElement;
                    const query = input?.value;
                    if (!query || query.length < 3) return;

                    setIsSearching(true);
                    await performSearch(query);
                    setIsSearching(false);
                  }}
                  disabled={isSearching}
                >
                  {isSearching ? 'Searching...' : 'Semantic Search'}
                </button>
              </div>

              {/* Semantic Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Semantic Results:
                  </h4>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/dashboard/entry/${result.id}`)
                        }
                        type="button"
                      >
                        <div className="flex items-start space-x-3">
                          {result.metadata?.type === 'image' &&
                            imageUrls[result.id] && (
                              <img
                                src={imageUrls[result.id]}
                                alt="Entry preview"
                                className="size-16 rounded object-cover"
                              />
                            )}
                          <div className="min-w-0 flex-1">
                            <div
                              className="line-clamp-3 text-sm text-gray-900"
                              dangerouslySetInnerHTML={{
                                __html:
                                  searchHighlights[result.id] || result.data,
                              }}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(result.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </InstantSearch>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <input
                  id="dashboard-search-fallback"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search your entries..."
                  className="w-full rounded-lg border border-gray-300 p-3 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="size-4 animate-spin rounded-full border-b-2 border-gray-900" />
                  </div>
                )}
              </div>

              {/* Fallback Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                      onClick={() =>
                        router.push(`/dashboard/entry/${result.id}`)
                      }
                      type="button"
                    >
                      <div className="flex items-start space-x-3">
                        {result.metadata?.type === 'image' &&
                          imageUrls[result.id] && (
                            <img
                              src={imageUrls[result.id]}
                              alt="Entry preview"
                              className="size-16 rounded object-cover"
                            />
                          )}
                        <div className="min-w-0 flex-1">
                          <div
                            className="line-clamp-3 text-sm text-gray-900"
                            dangerouslySetInnerHTML={{
                              __html:
                                searchHighlights[result.id] || result.data,
                            }}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(result.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Store Section */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Store</CardTitle>
          <CardDescription>
            Add new content to your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="mb-6 flex space-x-2">
            <TabButton
              label="Text"
              isActive={activeTab === 'text'}
              onClick={() => setActiveTab('text')}
            />
            <TabButton
              label="Image"
              isActive={activeTab === 'image'}
              onClick={() => setActiveTab('image')}
            />
            <TabButton
              label="URL"
              isActive={activeTab === 'url'}
              onClick={() => setActiveTab('url')}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Enter your thoughts..."
                className="h-32 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleTextUpload}
                disabled={!textValue.trim() || isUploading}
                className="rounded-lg px-6 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {isUploading ? 'Adding...' : 'Add Text'}
              </button>
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <ImageUpload
                metadata={{}}
                onUploadComplete={() => {
                  // Start polling for log updates
                  pollLogUpdates();
                  // Show success toast
                  setToastMessage('Image uploaded successfully!');
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-4">
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUrlUpload}
                disabled={!urlValue.trim() || isUploading}
                className="rounded-lg px-6 py-2 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                {isUploading ? 'Adding...' : 'Add URL'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synthesize Section */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Synthesize</CardTitle>
          <CardDescription>
            Connect ideas by commenting on existing content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {randomEntry ? (
            <div className="space-y-4">
              {/* Random Entry Display */}
              <button
                className="w-full cursor-pointer rounded-lg p-4 text-left transition-colors hover:bg-gray-100"
                onClick={() =>
                  router.push(`/dashboard/entry/${randomEntry.id}`)
                }
                type="button"
              >
                <div className="flex items-start space-x-3">
                  {randomEntry.metadata?.type === 'image' && (
                    <div className="mb-2 text-sm text-gray-500">
                      📷 Image Entry
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="mb-2 text-gray-900">{randomEntry.data}</p>
                    <p className="text-xs text-gray-500">
                      Created:{' '}
                      {new Date(randomEntry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>

              {/* Comment Input */}
              <div className="space-y-3">
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-sm font-medium text-gray-700">
                  Add your thoughts about this entry:
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What connections do you see? What does this remind you of?"
                  className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || isAddingComment}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                  >
                    {isAddingComment ? 'Adding Comment...' : 'Add Comment'}
                  </button>
                  <button
                    onClick={loadRandomEntry}
                    className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                    type="button"
                  >
                    Get Another Entry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="size-8 animate-spin rounded-full border-b-2 border-gray-900" />
              <span className="ml-2 text-gray-600">
                Loading random entry...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Section */}
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle>Log</CardTitle>
          <CardDescription>Recent activity log</CardDescription>
        </CardHeader>
        <CardContent>
          {/* eslint-disable-next-line */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-8 animate-spin rounded-full border-b-2 border-gray-900" />
              <span className="ml-2 text-gray-600">
                Loading activity log...
              </span>
            </div>
          ) : recentComments.length > 0 ? (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {recentComments.map((comment) => (
                <button
                  key={comment.id}
                  className="w-full cursor-pointer rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() => router.push(`/dashboard/entry/${comment.id}`)}
                  type="button"
                >
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      {comment.metadata?.type === 'image' &&
                        logImageUrls[comment.id] && (
                          <img
                            src={logImageUrls[comment.id]}
                            alt="Entry thumbnail"
                            className="size-12 shrink-0 rounded object-cover"
                          />
                        )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm text-gray-900">
                          {comment.data.startsWith('URL: ') ? (
                            <span className="text-orange-600">
                              {comment.data}{' '}
                              <span className="text-xs">(processing...)</span>
                            </span>
                          ) : (
                            comment.data
                          )}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {comment.metadata?.parent_id
                              ? `Comment on: ${comment.metadata?.title || 'Entry'}`
                              : `${comment.metadata?.type || 'Entry'}`}
                          </span>
                          <span>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No recent activity yet</p>
              <p className="text-sm">
                Activity will appear here as you use the app
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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

export default SimpleDashboard;
