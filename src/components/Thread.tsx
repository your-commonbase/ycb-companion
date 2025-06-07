'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { InstagramEmbed } from 'react-social-media-embed';
import { Tweet } from 'react-tweet';

import ImageUpload from '@/components/ImageUpload';
import PendingQueue from '@/components/PendingQueue';
import { fetchRandomEntry } from '@/helpers/functions';
import {
  enqueueAddText,
  enqueueAddURL,
  useAddQueueProcessor,
} from '@/hooks/useAddQueue';

import LinkPreviewCard from './LinkPreview';

interface Entry {
  id: string;
  data: string;
  comments?: Entry[];
  createdAt: string;
  metadata: any;
  similarity?: number;
}

interface FlattenedEntry extends Entry {
  relationshipType: 'root' | 'parent' | 'comment' | 'neighbor';
  relationshipSource?: string;
  level: number;
  hasMoreRelations?: boolean;
  isProcessing?: boolean;
  tempImageUrl?: string;
}

interface ThreadEntryCardProps {
  entry: FlattenedEntry;
  onRelationshipExpand: (
    entryId: string,
    type: 'parent' | 'comments' | 'neighbors',
  ) => void;
  onNavigateToEntry: (entryId: string) => void;
  onAddNewEntry: (newEntry: FlattenedEntry, parentId: string) => void;
  onImageUpload: (result: any, parentId: string) => void;
  expandedRelationships?: Set<string>;
  allEntryIds?: Set<string>;
}

const ThreadEntryCard: React.FC<ThreadEntryCardProps> = ({
  entry,
  onRelationshipExpand,
  onNavigateToEntry,
  onAddNewEntry,
  onImageUpload,
  expandedRelationships = new Set(),
  allEntryIds = new Set(),
}) => {
  const [cdnImageUrl, setCdnImageUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.data);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingURL, setIsAddingURL] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [randomCommentPlaceholder, setRandomCommentPlaceholder] =
    useState('Add a comment...');

  const { metadata } = entry;
  const aliasIds: string[] = metadata.alias_ids || [];
  const parentId =
    metadata.parent_id && metadata.parent_id.trim() !== ''
      ? metadata.parent_id
      : null;

  useEffect(() => {
    const asyncFn = async () => {
      const rentry = await fetchRandomEntry();
      setRandomCommentPlaceholder(rentry.data);
    };
    asyncFn();
  }, []);

  useEffect(() => {
    if (metadata.type === 'image') {
      const fetchData = async () => {
        const { id } = entry;
        const cdnResp = await fetch(`/api/fetchImageByIDs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: [id],
          }),
        });
        const cdnData = await cdnResp.json();

        setCdnImageUrl(
          cdnData.data.body.urls[id] ? cdnData.data.body.urls[id] : '',
        );
      };

      fetchData();
    }
  }, [metadata.type]);

  function timeAgo(dateString: string) {
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const seconds = Math.floor((now - then) / 1000);

    const intervals = [
      { label: 'year', secs: 31536000 },
      { label: 'month', secs: 2592000 },
      { label: 'week', secs: 604800 },
      { label: 'day', secs: 86400 },
      { label: 'hour', secs: 3600 },
      { label: 'minute', secs: 60 },
      { label: 'second', secs: 1 },
    ];

    for (const { label, secs } of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) {
        return `${count} ${label}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  function convertDate(date: string) {
    const dateParts = date.split('T');
    const dateParts2 = dateParts[0]!.split('-');
    return `${dateParts2[1]}-${dateParts2[2]}-${dateParts2[0]}`;
  }

  const updateEntry = async (newText: string) => {
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entry.id,
          data: newText,
          metadata: entry.metadata,
        }),
      });

      if (response.ok) {
        // eslint-disable-next-line no-param-reassign
        entry.data = newText;
        setIsEditing(false);
      } else {
        console.error('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleSave = () => {
    updateEntry(editText);
  };

  const handleCancel = () => {
    setEditText(entry.data);
    setIsEditing(false);
  };

  const addComment = (
    aliasInput: string,
    parent: { id: string; data: string; metadata: any },
  ) => {
    enqueueAddText(
      {
        data: aliasInput,
        metadata: {
          parent_id: parent.id,
          title: parent.metadata.title,
          author: parent.metadata.author,
        },
        parentId: parent.id,
      },
      (addedCommentData) => {
        const newEntry: FlattenedEntry = {
          id: addedCommentData.id,
          data: aliasInput,
          comments: [],
          createdAt: addedCommentData.createdAt,
          metadata: {
            ...addedCommentData.metadata,
            parent_id: parent.id,
          },
          relationshipType: 'comment',
          relationshipSource: parent.id,
          level: entry.level + 1,
          hasMoreRelations: true,
        };
        onAddNewEntry(newEntry, parent.id);
      },
    );
  };

  const addURL = async (
    url: string,
    parent: { id: string; data: string; metadata: any },
  ) => {
    enqueueAddURL(
      {
        url,
        metadata: {
          parent_id: parent.id,
        },
      },
      (addedCommentData) => {
        const newEntry: FlattenedEntry = {
          id: addedCommentData.id,
          data: addedCommentData.data || url,
          comments: [],
          createdAt: addedCommentData.createdAt,
          metadata: {
            ...addedCommentData.metadata,
            parent_id: parent.id,
          },
          relationshipType: 'comment',
          relationshipSource: parent.id,
          level: entry.level + 1,
          hasMoreRelations: true,
        };
        onAddNewEntry(newEntry, parent.id);
      },
    );
  };

  // Get relationship indicator styling
  const getRelationshipStyle = () => {
    switch (entry.relationshipType) {
      case 'root':
        return 'border-l-4 bg-blue-50';
      case 'parent':
        return 'border-l-4 bg-purple-50';
      case 'comment':
        return 'border-l-4  bg-orange-50';
      case 'neighbor':
        return 'border-l-4  bg-green-50';
      default:
        return 'border-l-4 -300 bg-white';
    }
  };

  const getRelationshipLabel = () => {
    switch (entry.relationshipType) {
      case 'root':
        return 'Main Entry';
      case 'parent':
        return 'Parent Entry';
      case 'comment':
        return 'Comment';
      case 'neighbor':
        return 'Related Entry';
      default:
        return '';
    }
  };

  return (
    <div
      id={`entry-${entry.id}`}
      className={`w-full rounded-xl border-2 bg-white shadow-lg transition-all duration-200 hover:shadow-xl ${getRelationshipStyle()}`}
    >
      {/* Header with relationship indicator */}
      {entry.relationshipType !== 'root' && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              {getRelationshipLabel()}
            </span>
            {entry.relationshipSource && (
              <button
                onClick={() => {
                  const targetElement = document.getElementById(
                    `entry-${entry.relationshipSource}`,
                  );
                  if (targetElement) {
                    targetElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    // Add a brief highlight effect
                    targetElement.style.transition =
                      'background-color 0.3s ease';
                    targetElement.style.backgroundColor =
                      'rgba(59, 130, 246, 0.1)';
                    setTimeout(() => {
                      targetElement.style.backgroundColor = '';
                    }, 1000);
                  }
                }}
                className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                type="button"
              >
                ← from {entry.relationshipSource.slice(0, 8)}...
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Entry Content */}
        <div className="mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={6}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  type="button"
                  className="rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown className="text-lg leading-relaxed text-gray-900">
                {entry.data}
              </ReactMarkdown>
            </div>
          )}

          {/* Source Link */}
          {entry.metadata.title && (
            <a
              className="mt-3 inline-block text-sm text-gray-500 hover:text-blue-600 hover:underline"
              href={entry.metadata.author}
              target="_blank"
              rel="noopener noreferrer"
            >
              {entry.metadata.title}
            </a>
          )}

          {/* Image Display */}
          {metadata.type === 'image' && (
            <div className="mt-4">
              {
                // eslint-disable-next-line no-nested-ternary
                entry.isProcessing ? (
                  <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
                    {entry.tempImageUrl ? (
                      <img
                        src={entry.tempImageUrl}
                        alt="Processing..."
                        className="size-full object-cover opacity-75"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-2 size-8 animate-spin rounded-full border-b-2 border-blue-500" />
                          <p className="text-sm text-gray-500">
                            Processing image...
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-lg">
                        <div className="flex items-center gap-2">
                          <div className="size-4 animate-spin rounded-full border-b-2 border-blue-500" />
                          Processing...
                        </div>
                      </div>
                    </div>
                  </div>
                ) : cdnImageUrl ? (
                  <img
                    src={cdnImageUrl}
                    alt="Entry content"
                    className="h-auto max-w-full rounded-lg shadow-md"
                  />
                ) : null
              }
            </div>
          )}
        </div>

        {/* Social Media Embeds */}
        <div className="space-y-4">
          {entry.metadata.author &&
            !entry.metadata.author.includes('yourcommonbase.com') &&
            !entry.metadata.author.includes('instagram.com') &&
            !entry.metadata.author.includes('x.com') &&
            (entry.metadata.ogTitle || entry.metadata.ogDescription) &&
            entry.metadata.ogImages &&
            entry.metadata.ogImages.length > 0 && (
              <LinkPreviewCard
                url={entry.metadata.author}
                title={entry.metadata.ogTitle}
                description={entry.metadata.ogDescription}
                image={entry.metadata.ogImages[0]}
              />
            )}
          {entry.metadata.author &&
            entry.metadata.author.includes('instagram.com') && (
              <InstagramEmbed url={entry.metadata.author} />
            )}
          {entry.metadata.author &&
            (entry.metadata.author.includes('twitter.com') ||
              entry.metadata.author.includes('t.co') ||
              (entry.metadata.author.includes('x.com') &&
                entry.metadata.author.includes('status'))) && (
              <Tweet id={entry.metadata.author.split('status/')[1]} />
            )}
        </div>

        {/* Metadata and Actions Footer */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side - Relationship indicators */}
            <div className="flex flex-wrap gap-2">
              {aliasIds.length > 0 && (
                <button
                  onClick={() => onRelationshipExpand(entry.id, 'comments')}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    expandedRelationships.has(`${entry.id}-comments`)
                      ? 'cursor-default bg-gray-200 text-gray-600'
                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                  }`}
                  disabled={expandedRelationships.has(`${entry.id}-comments`)}
                >
                  {aliasIds.length} comment{aliasIds.length !== 1 ? 's' : ''}
                </button>
              )}
              {parentId && !allEntryIds.has(parentId) && (
                <button
                  onClick={() => onRelationshipExpand(entry.id, 'parent')}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    expandedRelationships.has(`${entry.id}-parent`)
                      ? 'cursor-default bg-gray-200 text-gray-600'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  }`}
                  disabled={expandedRelationships.has(`${entry.id}-parent`)}
                >
                  has parent
                </button>
              )}
              {entry.hasMoreRelations && (
                <button
                  onClick={() => onRelationshipExpand(entry.id, 'neighbors')}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    expandedRelationships.has(`${entry.id}-neighbors`)
                      ? 'cursor-default bg-gray-200 text-gray-600'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  disabled={expandedRelationships.has(`${entry.id}-neighbors`)}
                >
                  see related
                </button>
              )}
              {entry.similarity !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {Math.round(entry.similarity * 100)}% similar
                </span>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
              <a
                href={`/dashboard/garden?date=${convertDate(entry.createdAt)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                {timeAgo(entry.createdAt)}
              </a>
              <button
                onClick={() => onNavigateToEntry(entry.id)}
                type="button"
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                {entry.id.slice(0, 8)}...
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  type="button"
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={() => setIsAddingComment(true)}
            type="button"
            className="rounded-lg bg-blue-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Add Comment
          </button>
          <button
            onClick={() => setIsAddingImage(true)}
            type="button"
            className="rounded-lg bg-green-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            Add Image
          </button>
          <button
            onClick={() => setIsAddingURL(true)}
            type="button"
            className="rounded-lg bg-purple-400 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            Add URL
          </button>
        </div>

        {/* Add Forms */}
        {isAddingImage && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">
              Add Image
            </h4>
            <ImageUpload
              metadata={{ parent_id: entry.id }}
              onUploadComplete={(result) => {
                onImageUpload(result, entry.id);
                setIsAddingImage(false);
              }}
            />
          </div>
        )}

        {isAddingURL && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">Add URL</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="https://yourcommonbase.com/dashboard"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                id={`link-input-comment-${entry.id}`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = document.getElementById(
                      `link-input-comment-${entry.id}`,
                    );
                    if (!url) return;
                    const urlValue = (url as HTMLInputElement).value.trim();
                    if (!urlValue) return;
                    addURL(urlValue, entry);
                    setIsAddingURL(false);
                  }}
                  type="button"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Add URL
                </button>
                <button
                  onClick={() => setIsAddingURL(false)}
                  type="button"
                  className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddingComment && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">
              Add Comment
            </h4>
            <div className="space-y-3">
              <textarea
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={randomCommentPlaceholder}
                id={`alias-input-comment-${entry.id}`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const aliasInput = document.getElementById(
                      `alias-input-comment-${entry.id}`,
                    );
                    if (!aliasInput) return;
                    const alias = (aliasInput as HTMLInputElement).value.trim();
                    if (!alias) return;
                    addComment(alias, {
                      id: entry.id,
                      data: entry.data,
                      metadata: entry.metadata,
                    });
                    (aliasInput as HTMLInputElement).value = '';
                    setIsAddingComment(false);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Comment
                </button>
                <button
                  onClick={() => setIsAddingComment(false)}
                  type="button"
                  className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Thread({ inputId }: { inputId: string }) {
  const [flattenedEntries, setFlattenedEntries] = useState<FlattenedEntry[]>(
    [],
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedRelationships, setExpandedRelationships] = useState<
    Set<string>
  >(new Set());
  const [, setProcessingImages] = useState<Set<string>>(new Set());
  const idSet = useRef(new Set<string>());
  const router = useRouter();
  useAddQueueProcessor();

  const flattenEntry = (
    entry: Entry,
    relationshipType: 'root' | 'parent' | 'comment' | 'neighbor',
    level: number = 0,
    relationshipSource?: string,
  ): FlattenedEntry => ({
    ...entry,
    relationshipType,
    relationshipSource,
    level,
    hasMoreRelations: true, // All entries can have related/neighbor entries
  });

  const expandRelationships = async (
    entryId: string,
    type: 'parent' | 'comments' | 'neighbors',
  ) => {
    const relationshipKey = `${entryId}-${type}`;

    // Mark this relationship as expanded
    setExpandedRelationships((prev) => new Set([...prev, relationshipKey]));

    setLoadingMore(true);

    try {
      const currentEntry = flattenedEntries.find((e) => e.id === entryId);
      if (!currentEntry) return;

      const currentIndex = flattenedEntries.findIndex((e) => e.id === entryId);
      const newEntries: FlattenedEntry[] = [];

      if (type === 'parent' && currentEntry.metadata.parent_id) {
        const parentId = currentEntry.metadata.parent_id;
        if (!idSet.current.has(parentId)) {
          const res = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: parentId }),
          });
          const data = await res.json();

          const parentEntry = flattenEntry(
            data.data,
            'parent',
            currentEntry.level,
            entryId,
          );
          newEntries.push(parentEntry);
          idSet.current.add(parentId);
        }
      }

      if (type === 'comments' && currentEntry.metadata.alias_ids) {
        const aliasIds = currentEntry.metadata.alias_ids;
        for (const aliasId of aliasIds) {
          if (!idSet.current.has(aliasId)) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const res = await fetch('/api/fetch', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id: aliasId }),
              });
              // eslint-disable-next-line no-await-in-loop
              const data = await res.json();

              const commentEntry = flattenEntry(
                data.data,
                'comment',
                currentEntry.level + 1,
                entryId,
              );
              newEntries.push(commentEntry);
              idSet.current.add(aliasId);
            } catch (error) {
              console.error('Error fetching comment:', error);
            }
          }
        }
      }

      if (type === 'neighbors') {
        try {
          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ platformId: entryId }),
          });
          const data = await res.json();

          data.data.forEach((neighborEntry: Entry) => {
            if (!idSet.current.has(neighborEntry.id)) {
              const neighbor = flattenEntry(
                neighborEntry,
                'neighbor',
                currentEntry.level + 1,
                entryId,
              );
              newEntries.push(neighbor);
              idSet.current.add(neighborEntry.id);
            }
          });
        } catch (error) {
          console.error('Error fetching neighbors:', error);
        }
      }

      // Insert new entries after the current entry
      setFlattenedEntries((prev) => [
        ...prev.slice(0, currentIndex + 1),
        ...newEntries,
        ...prev.slice(currentIndex + 1),
      ]);
    } catch (error) {
      console.error('Error expanding relationships:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const navigateToEntry = (entryId: string) => {
    router.push(`/dashboard/entry/${entryId}`);
  };

  const handleRollTheDice = async () => {
    try {
      const randomEntry = await fetchRandomEntry();
      router.push(`/dashboard/entry/${randomEntry.id}`);
    } catch (error) {
      console.error('Error fetching random entry:', error);
    }
  };

  const handleAddNewEntry = (newEntry: FlattenedEntry, parentId: string) => {
    // Find the parent entry index
    const parentIndex = flattenedEntries.findIndex((e) => e.id === parentId);
    if (parentIndex === -1) return;

    // Add the new entry immediately after the parent
    setFlattenedEntries((prev) => [
      ...prev.slice(0, parentIndex + 1),
      newEntry,
      ...prev.slice(parentIndex + 1),
    ]);

    // Add to ID tracking sets
    idSet.current.add(newEntry.id);
  };

  const pollImageProcessing = async (entryId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: entryId }),
        });
        const data = await response.json();

        if (data.data && data.data.data && data.data.data.trim() !== '') {
          // Image processing is complete, update the entry
          setFlattenedEntries((prev) =>
            prev.map((entry) =>
              entry.id === entryId
                ? {
                    ...entry,
                    data: data.data.data,
                    metadata: data.data.metadata,
                    isProcessing: false,
                  }
                : entry,
            ),
          );
          setProcessingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(entryId);
            return newSet;
          });
          return;
        }

        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          // Stop polling after max attempts
          setProcessingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(entryId);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error polling image processing:', error);
        setProcessingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(entryId);
          return newSet;
        });
      }
    };

    poll();
  };

  const handleImageUpload = (result: any, parentId: string) => {
    // Find the parent entry to get its level
    const parentEntry = flattenedEntries.find((e) => e.id === parentId);
    if (!parentEntry) return;

    const newEntry: FlattenedEntry = {
      id: result.id,
      data: '', // Will be filled when processing completes
      comments: [],
      createdAt: result.createdAt || new Date().toISOString(),
      metadata: {
        parent_id: parentId,
        type: 'image',
        author: '',
      },
      relationshipType: 'comment',
      relationshipSource: parentId,
      level: parentEntry.level + 1,
      hasMoreRelations: true,
      isProcessing: true,
      tempImageUrl: result.imageUrl,
    };

    handleAddNewEntry(newEntry, parentId);
    setProcessingImages((prev) => new Set([...prev, result.id]));
    pollImageProcessing(result.id);
  };

  useEffect(() => {
    const fetchInitialEntry = async () => {
      try {
        const res = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: inputId }),
        });
        const data = await res.json();

        const rootEntry = flattenEntry(data.data, 'root', 0);
        setFlattenedEntries([rootEntry]);
        idSet.current.add(data.data.id);
      } catch (error) {
        console.error('Error fetching initial entry:', error);
      }
    };

    fetchInitialEntry();
  }, [inputId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl py-4">
        <PendingQueue idSet={idSet} />

        {/* Thread entries - vertical scroll like social media */}
        <div className="space-y-4">
          {flattenedEntries.map((entry) => (
            <ThreadEntryCard
              key={`${entry.id}`}
              entry={entry}
              onRelationshipExpand={expandRelationships}
              onNavigateToEntry={navigateToEntry}
              onAddNewEntry={handleAddNewEntry}
              onImageUpload={handleImageUpload}
              expandedRelationships={expandedRelationships}
              allEntryIds={new Set(flattenedEntries.map((e) => e.id))}
            />
          ))}
        </div>

        {/* Loading indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-b-2 border-blue-500" />
          </div>
        )}

        {/* Roll the Dice button */}
        <div className="flex justify-center py-8">
          <button
            onClick={handleRollTheDice}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            type="button"
          >
            /random
          </button>
        </div>
      </div>
    </div>
  );
}
