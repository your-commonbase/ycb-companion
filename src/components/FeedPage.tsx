'use client';

import { useCallback, useEffect, useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactMarkdown from 'react-markdown';
import { InstagramEmbed } from 'react-social-media-embed';
import { Tweet } from 'react-tweet';

import { fetchRandomEntry } from '@/helpers/functions';
import { enqueueAddText, useAddQueueProcessor } from '@/hooks/useAddQueue';

interface Entry {
  id: string;
  data: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function FeedPage() {
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [cdnImageUrl, setCdnImageUrl] = useState<string>('');
  const [commentPlaceholder, setCommentPlaceholder] = useState(
    'Add your thoughts...',
  );

  // Initialize queue processor for comment submission
  useAddQueueProcessor();

  const generateRandomPlaceholder = async () => {
    try {
      const randomEntry = await fetchRandomEntry();
      setCommentPlaceholder(`${randomEntry.data.slice(0, 50)}...`);
    } catch (error) {
      setCommentPlaceholder('Add your thoughts...');
    }
  };

  const fetchImageUrl = async (entryId: string) => {
    try {
      const response = await fetch('/api/fetchImageByIDs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [entryId] }),
      });
      const data = await response.json();
      setCdnImageUrl(data.data.body.urls[entryId] || '');
    } catch (error) {
      // Error fetching image URL
    }
  };

  const loadRandomEntry = useCallback(async () => {
    setIsLoading(true);
    try {
      const entry = await fetchRandomEntry();
      setCurrentEntry(entry);

      // If it's an image, fetch the CDN URL
      if (entry.metadata.type === 'image') {
        fetchImageUrl(entry.id);
      }

      // Generate new placeholder for next comment
      generateRandomPlaceholder();
    } catch (error) {
      // Error loading random entry
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitComment = async () => {
    if (!comment.trim() || !currentEntry) return;

    setIsSubmittingComment(true);
    try {
      enqueueAddText(
        {
          data: comment.trim(),
          metadata: {
            parent_id: currentEntry.id,
            title: currentEntry.metadata.title || 'Feed Comment',
            author: currentEntry.metadata.author || 'Feed',
          },
          parentId: currentEntry.id,
        },
        () => {
          // Comment successfully submitted
          setComment('');
          // Auto-advance to next entry after commenting
          setTimeout(() => {
            loadRandomEntry();
          }, 500);
        },
      );
    } catch (error) {
      // Error submitting comment
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitComment();
    }
  };

  // Load initial random entry
  useEffect(() => {
    loadRandomEntry();
    // Set a random comment placeholder
    generateRandomPlaceholder();
  }, [loadRandomEntry]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

      if (!isInputFocused) {
        switch (e.key.toLowerCase()) {
          case 'r':
            e.preventDefault();
            loadRandomEntry();
            break;
          case 'c': {
            e.preventDefault();
            // Focus on comment textarea
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.focus();
            break;
          }
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [loadRandomEntry]);

  if (isLoading && !currentEntry) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-gray-700">
            Loading Feed...
          </div>
          <div className="animate-pulse text-gray-500">
            Finding something interesting for you
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl font-bold text-red-600">
            No entries found
          </div>
          <button
            onClick={loadRandomEntry}
            className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
            type="button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtube\.be\/)([^&\n?#]+)/,
    );
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
          <p className="text-gray-600">
            Discover and comment on random entries
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          {/* Entry Content */}
          <div className="mb-8">
            {/* Entry Text */}
            <div className="mb-6">
              <ReactMarkdown className="prose prose-lg max-w-none text-gray-900">
                {currentEntry.data}
              </ReactMarkdown>
            </div>

            {/* Media Content */}
            {currentEntry.metadata.type === 'image' && cdnImageUrl && (
              <div className="mb-6">
                {/* Using regular img tag for CDN images with signed URLs */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cdnImageUrl}
                  alt="Entry content"
                  className="h-auto max-w-full rounded-lg shadow-md"
                  loading="lazy"
                />
              </div>
            )}

            {/* YouTube Embed */}
            {currentEntry.metadata.author?.includes('youtube.com') && (
              <div className="mb-6">
                {(() => {
                  const videoId = getYouTubeId(currentEntry.metadata.author);
                  return videoId ? (
                    <LiteYouTubeEmbed id={videoId} title="YouTube video" />
                  ) : null;
                })()}
              </div>
            )}

            {/* Instagram Embed */}
            {currentEntry.metadata.author?.includes('instagram.com') && (
              <div className="mb-6">
                <InstagramEmbed url={currentEntry.metadata.author} />
              </div>
            )}

            {/* Twitter/X Embed */}
            {(currentEntry.metadata.author?.includes('twitter.com') ||
              currentEntry.metadata.author?.includes('t.co') ||
              currentEntry.metadata.author?.includes('x.com')) && (
              <div className="mb-6">
                {(() => {
                  const tweetId = currentEntry.metadata.author
                    .split('status/')[1]
                    ?.split('?')[0];
                  return tweetId ? <Tweet id={tweetId} /> : null;
                })()}
              </div>
            )}

            {/* Entry Metadata */}
            <div className="flex items-center justify-between border-t pt-4 text-sm text-gray-500">
              <div>
                <span>Created: {formatDate(currentEntry.createdAt)}</span>
                {currentEntry.metadata.author && (
                  <span className="ml-4">
                    Source:{' '}
                    {(() => {
                      try {
                        return new URL(currentEntry.metadata.author).hostname;
                      } catch {
                        return currentEntry.metadata.author;
                      }
                    })()}
                  </span>
                )}
              </div>
              <a
                href={`/dashboard/entry/${currentEntry.id}`}
                className="text-xs text-gray-400"
              >
                ID: {currentEntry.id}
              </a>
            </div>
          </div>

          {/* Comment Section */}
          <div className="border-t pt-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Add a Comment
            </h3>

            <div className="space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={commentPlaceholder}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Press Cmd+Enter to submit
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={submitComment}
                    disabled={!comment.trim() || isSubmittingComment}
                    className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    type="button"
                  >
                    {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                  </button>

                  <button
                    onClick={loadRandomEntry}
                    disabled={isLoading}
                    className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                    type="button"
                  >
                    {isLoading ? 'Loading...' : 'Next Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
