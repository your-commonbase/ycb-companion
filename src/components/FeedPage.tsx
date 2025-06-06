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

interface Comment {
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
  const [parentEntry, setParentEntry] = useState<Entry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingParent, setLoadingParent] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

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

  const fetchParentEntry = async (parentId: string) => {
    console.log('fetching parent entry with id:', parentId);
    setLoadingParent(true);
    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parentId }),
      });
      const data = await response.json();
      console.log('data:', data);
      if (data) {
        setParentEntry(data.data);
        console.log('parentEntry:', data.data);
      }
    } catch (error) {
      console.error('Error fetching parent entry:', error);
    } finally {
      setLoadingParent(false);
    }
  };

  const fetchComments = async (aliasIds: string[]) => {
    console.log('fetching comments with ids:', aliasIds);
    setLoadingComments(true);
    try {
      const commentPromises = aliasIds.map(async (aliasId) => {
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: aliasId }),
        });
        const data = await response.json();
        return data.data ? data.data : null;
      });

      const commentResults = await Promise.all(commentPromises);
      const validComments = commentResults.filter(Boolean);
      console.log('validComments:', validComments);
      setComments(validComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadRandomEntry = useCallback(async () => {
    setIsLoading(true);
    // Clear previous data
    setParentEntry(null);
    setComments([]);
    setCdnImageUrl('');

    try {
      const entry = await fetchRandomEntry();
      setCurrentEntry(entry);

      // If it's an image, fetch the CDN URL
      if (entry.metadata.type === 'image') {
        fetchImageUrl(entry.id);
      }

      console.log('entry:', entry);

      // Fetch parent entry if it exists
      if (entry.metadata.parent_id) {
        console.log('fetching parent entry');
        fetchParentEntry(entry.metadata.parent_id);
      }

      // Fetch comments if they exist
      if (entry.metadata.alias_ids && entry.metadata.alias_ids.length > 0) {
        console.log('fetching comments');
        fetchComments(entry.metadata.alias_ids);
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
          // Refresh comments to show the new one
          if (
            currentEntry.metadata.alias_ids &&
            currentEntry.metadata.alias_ids.length > 0
          ) {
            fetchComments(currentEntry.metadata.alias_ids);
          }
          // Auto-advance to next entry after commenting
          setTimeout(() => {
            loadRandomEntry();
          }, 1000);
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
          {/* Parent Entry */}
          {parentEntry && (
            <div className="mb-6 border-l-4 border-purple-300 bg-purple-50 pl-4">
              <div className="mb-2 text-sm font-medium text-purple-700">
                Parent Entry
              </div>
              <div className="text-gray-800">
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {parentEntry.data}
                </ReactMarkdown>
              </div>
              <div className="mt-2 text-xs text-purple-600">
                Created: {formatDate(parentEntry.createdAt)}
              </div>
            </div>
          )}

          {loadingParent && (
            <div className="mb-6 animate-pulse border-l-4 border-purple-200 bg-purple-50 p-4">
              <div className="text-sm text-purple-600">
                Loading parent entry...
              </div>
            </div>
          )}

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

          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Comments ({comments.length})
              </h3>
              <div className="space-y-4">
                {comments.map((commentEntry) => (
                  <div
                    key={commentEntry.id}
                    className="border-l-4 border-orange-300 bg-orange-50 pl-4"
                  >
                    <div className="text-gray-800">
                      <ReactMarkdown className="prose prose-sm max-w-none">
                        {commentEntry.data}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-2 text-xs text-orange-600">
                      Created: {formatDate(commentEntry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingComments && (
            <div className="mb-8">
              <div className="animate-pulse border-l-4 border-orange-200 bg-orange-50 p-4">
                <div className="text-sm text-orange-600">
                  Loading comments...
                </div>
              </div>
            </div>
          )}

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
                    className="rounded-lg bg-gray-200 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                    type="button"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                        Loading...
                      </div>
                    ) : (
                      'Next Entry'
                    )}
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
