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

interface ThreadEntryProps {
  entry: Entry;
  neighbors: { [key: string]: Entry[] };
  fetchNeighbors: (query: string, id: string) => void;
  idSet: React.MutableRefObject<Set<string>>;
  recordExpanded: (entry: Entry) => void;
  recordFetched: (entry: Entry) => void;
  type: 'root' | 'parent' | 'comment' | 'neighbor';
  depth?: number;
  maxDepth?: number;
}

const ThreadEntry: React.FC<ThreadEntryProps> = ({
  entry,
  neighbors,
  fetchNeighbors,
  idSet,
  recordExpanded,
  recordFetched,
  type,
  depth = 0,
  maxDepth = 8,
}) => {
  const [aliasComments, setAliasComments] = useState<Entry[]>([]);
  const [parentComment, setParentComment] = useState<Entry | null>(null);
  const [parentCommentLoaded, setParentCommentLoaded] = useState(false);
  const [aliasLoaded, setAliasLoaded] = useState(false);
  const [cdnImageUrl, setCdnImageUrl] = useState<string>('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingURL, setIsAddingURL] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.data);
  const [randomCommentPlaceholder, setRandomCommentPlaceholder] =
    useState('Add a comment...');
  const router = useRouter();

  const { metadata } = entry;
  const aliasIds: string[] = metadata.alias_ids || [];
  const parentId = metadata.parent_id || null;

  const commentsNotLoaded = aliasIds.filter((id) => !idSet.current.has(id));
  const parentNotLoaded = !idSet.current.has(parentId);

  // Calculate visual properties based on depth
  const isDeepNested = depth > 3;
  const shouldCollapse = depth > maxDepth;

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

  const handleToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const details = e.currentTarget;
    if (details.open) {
      recordExpanded(entry);
      if (!neighbors[entry.id]) {
        fetchNeighbors(entry.data, entry.id);
      }
      if (parentId && !parentCommentLoaded && !idSet.current.has(parentId)) {
        const parent = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: parentId }),
        });
        const data = await parent.json();

        if (!idSet.current.has(parentId)) {
          idSet.current.add(parentId);
          recordFetched(data.data);
        }

        setParentComment(data.data);
        setParentCommentLoaded(true);
      }
      if (aliasIds.length && !aliasLoaded) {
        const fetchedComments: any[] = await Promise.all(
          aliasIds.map(async (aliasId) => {
            try {
              const res = await fetch('/api/fetch', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id: aliasId }),
              });
              const data = await res.json();
              const entries: Entry[] = Array.isArray(data.data)
                ? data.data
                : [data.data];
              return entries.filter((aliasEntry) => {
                if (!idSet.current.has(aliasEntry.id)) {
                  idSet.current.add(aliasEntry.id);
                  recordFetched(aliasEntry);
                  return true;
                }
                return false;
              });
            } catch (error) {
              console.error('error fetching alias comments:', error);
              return [];
            }
          }),
        );

        setAliasComments(fetchedComments.flat());
        setAliasLoaded(true);
      }
    }
  };

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
        setAliasComments((prev) => [
          ...prev,
          {
            id: addedCommentData.id,
            data: aliasInput,
            comments: [],
            createdAt: addedCommentData.createdAt,
            metadata: {
              ...parent.metadata,
              parent_id: parent.id,
              title: parent.metadata.title,
              author: parent.metadata.author,
            },
          },
        ]);
        idSet.current.add(addedCommentData.id);
        recordFetched(addedCommentData);
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
        setAliasComments((prev) => [
          ...prev,
          {
            id: addedCommentData.id,
            data: addedCommentData.data,
            comments: [],
            createdAt: addedCommentData.createdAt,
            metadata: {
              ...parent.metadata,
              parent_id: parent.id,
              title: parent.metadata.title,
              author: parent.metadata.author,
            },
          },
        ]);
        idSet.current.add(addedCommentData.id);
        recordFetched(addedCommentData);
      },
    );
  };

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

  // Collapse deeply nested entries
  if (shouldCollapse) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
        <span className="px-2 py-1 text-xs font-medium">Depth {depth}</span>
        <span>Thread continues...</span>
        <button
          onClick={() => router.push(`/dashboard/entry/${entry.id}`)}
          className="text-blue-600 hover:underline"
          type="button"
        >
          View separately →
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ marginLeft: depth * 0 }}
      className={`
      mb-4 
      rounded-lg border border-gray-200 bg-white px-1 py-4
      shadow-sm                                    
    `}
    >
      <details onToggle={handleToggle} className="group">
        <summary className="cursor-pointer list-none pl-0 text-left">
          <div className="flex items-start gap-3">
            {/* Depth Indicator & Expand/Collapse */}
            <div className="flex items-center gap-2">
              {/* Depth Badge */}
              {depth > 0 && (
                <div className="flex size-6 items-center justify-center text-xs font-medium text-gray-700">
                  {depth}
                </div>
              )}

              {/* Expand/Collapse Button */}
              <div
                className={`
                  mt-1 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all 
                  group-open:bg-gray-200 group-open:text-gray-800
                  ${isDeepNested ? 'size-5' : 'size-6'}
                `}
              >
                <svg
                  className={`transition-transform group-open:rotate-90 ${isDeepNested ? 'size-3' : 'size-4'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              {/* Entry Content */}
              <div className={`px-2 ${isDeepNested ? 'mb-2' : 'mb-4'}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                      rows={isDeepNested ? 3 : 4}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        type="button"
                        className={`rounded-lg bg-green-600 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${isDeepNested ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} font-medium`}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        type="button"
                        className={`rounded-lg bg-gray-600 text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 ${isDeepNested ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} font-medium`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown
                      className={`
                          ${isDeepNested ? 'text-sm leading-snug' : 'text-lg leading-relaxed'}
                          ${type === 'root' ? 'font-medium text-gray-900' : ''}
                          ${type === 'parent' ? 'text-purple-800' : ''}
                          ${type === 'comment' ? 'text-orange-800' : ''}
                          ${type === 'neighbor' ? 'text-gray-700' : ''}
                        `}
                    >
                      {entry.data}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Source Link - Only show for non-deep entries */}
                {entry.metadata.title && !isDeepNested && (
                  <a
                    className="mt-2 inline-block text-xs text-gray-500 hover:text-blue-600 hover:underline"
                    href={entry.metadata.author}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {entry.metadata.title}
                  </a>
                )}

                {/* Image Display - Smaller for deep entries */}
                {metadata.type === 'image' && cdnImageUrl && (
                  <div className="mt-3">
                    <img
                      src={cdnImageUrl}
                      alt="Entry content"
                      className={`rounded-lg shadow-md ${isDeepNested ? 'max-w-sm' : 'h-auto max-w-full'}`}
                    />
                  </div>
                )}
              </div>

              {/* Metadata and Actions */}
              <div
                className={`flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 ${isDeepNested ? 'text-xs' : 'text-sm'}`}
              >
                {/* Status Badges */}
                <div className="flex gap-2">
                  {commentsNotLoaded.length > 0 && (
                    <span
                      className={`rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 ${isDeepNested ? 'text-xs' : 'text-sm'}`}
                    >
                      {commentsNotLoaded.length} comments
                    </span>
                  )}
                  {parentNotLoaded && (
                    <span
                      className={`rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 ${isDeepNested ? 'text-xs' : 'text-sm'}`}
                    >
                      has parent
                    </span>
                  )}
                  {entry.similarity !== undefined && (
                    <span
                      className={`rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 ${isDeepNested ? 'text-xs' : 'text-sm'}`}
                    >
                      {Math.round(entry.similarity * 100)}% similar
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-3 px-2">
                  <a
                    href={`/dashboard/garden?date=${convertDate(entry.createdAt)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 hover:underline"
                  >
                    {timeAgo(entry.createdAt)}
                  </a>
                  <button
                    onClick={() => {
                      router.push(`/dashboard/entry/${entry.id}`);
                    }}
                    type="button"
                    className="text-gray-500 hover:text-blue-600 hover:underline"
                  >
                    {entry.id.slice(0, 8)}...
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      type="button"
                      className={`rounded bg-gray-100 px-2 py-1 font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 ${isDeepNested ? 'text-xs' : 'text-sm'}`}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Embeds - Only for non-deep entries */}
          {!isDeepNested && (
            <div className="mt-6 space-y-4 px-2">
              {!entry.metadata.author.includes('yourcommonbase.com') &&
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
              {entry.metadata.author.includes('instagram.com') && (
                <InstagramEmbed url={entry.metadata.author} />
              )}
              {(entry.metadata.author.includes('twitter.com') ||
                entry.metadata.author.includes('t.co') ||
                entry.metadata.author.includes('x.com')) && (
                <Tweet id={entry.metadata.author.split('status/')[1]} />
              )}
            </div>
          )}
        </summary>

        {/* Expanded Content */}
        <div
          className={`mt-4 space-y-4 ${isDeepNested ? 'space-y-3' : 'space-y-6'}`}
        >
          {/* Action Buttons - Only for shallow entries */}
          {true && (
            <div className="flex flex-wrap gap-3 border-t border-gray-100 pl-2 pt-4">
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
          )}

          {/* Add Forms */}
          {isAddingImage && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 text-lg font-medium text-gray-900">
                Add Image
              </h4>
              <ImageUpload metadata={{ parent_id: entry.id }} />
            </div>
          )}

          {isAddingURL && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-3 text-lg font-medium text-gray-900">
                Add URL
              </h4>
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                      const alias = (
                        aliasInput as HTMLInputElement
                      ).value.trim();
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

          {/* Nested Thread Entries */}
          <div className="space-y-3">
            {/* Parent Entry */}
            {parentComment && (
              <div style={{ marginLeft: '8px' }}>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Parent Entry
                </h4>
                <ThreadEntry
                  key={`${parentComment.id}-key`}
                  entry={parentComment}
                  neighbors={neighbors}
                  fetchNeighbors={fetchNeighbors}
                  idSet={idSet}
                  recordExpanded={recordExpanded}
                  recordFetched={recordFetched}
                  type="parent"
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              </div>
            )}

            {/* Comments */}
            {aliasComments.length > 0 && (
              <div style={{ marginLeft: '8px' }}>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Comments ({aliasComments.length})
                </h4>
                <div className="space-y-3">
                  {aliasComments.map((comment) => (
                    <ThreadEntry
                      key={`${comment.id}-key`}
                      entry={comment}
                      neighbors={neighbors}
                      fetchNeighbors={fetchNeighbors}
                      idSet={idSet}
                      recordExpanded={recordExpanded}
                      recordFetched={recordFetched}
                      type="comment"
                      depth={depth + 1}
                      maxDepth={maxDepth}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Related/Neighbor Entries */}
            {neighbors[entry.id] && neighbors[entry.id]!.length > 0 && (
              <div style={{ marginLeft: '8px' }}>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Related Entries ({neighbors[entry.id]!.length})
                </h4>
                <div className="space-y-3">
                  {neighbors[entry.id]!.map((child) => (
                    <ThreadEntry
                      key={`${child.id}-key`}
                      entry={child}
                      neighbors={neighbors}
                      fetchNeighbors={fetchNeighbors}
                      idSet={idSet}
                      recordExpanded={recordExpanded}
                      recordFetched={recordFetched}
                      type="neighbor"
                      depth={depth + 1}
                      maxDepth={maxDepth}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
};

export default function Thread({ inputId }: { inputId: string }) {
  const [parent, setParent] = useState<Entry | null>(null);
  const [neighbors, setNeighbors] = useState<{ [key: string]: Entry[] }>({});
  const [expandedEntries, setExpandedEntries] = useState<Entry[]>([]);
  const [fetchedEntries, setFetchedEntries] = useState<{
    [key: string]: Entry;
  }>({});
  const idSet = useRef(new Set<string>());
  useAddQueueProcessor();

  useEffect(() => {
    console.log('expandedEntries:', expandedEntries);
    console.log('fetchedEntries:', fetchedEntries);
  }, []);

  const recordFetched = (entry: Entry) => {
    setFetchedEntries((prev) => {
      if (prev[entry.id]) return prev;
      return { ...prev, [entry.id]: entry };
    });
  };

  const recordExpanded = (entry: Entry) => {
    setExpandedEntries((prev) => {
      if (prev.some((e) => e.id === entry.id)) return prev;
      return [...prev, entry];
    });
  };

  const fetchNeighbors = async (query: string, id: string) => {
    try {
      console.log('fetching neighbors for', `${id} query: ${query}`);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ platformId: id }),
      });
      const data = await res.json();
      const newNeighbors: Entry[] = data.data.filter((entry: Entry) => {
        if (idSet.current.has(entry.id)) return false;
        idSet.current.add(entry.id);
        recordFetched(entry);
        return true;
      });
      setNeighbors((prev) => ({ ...prev, [id]: newNeighbors }));
    } catch (error) {
      console.error('error fetching neighbors:', error);
    }
  };

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        console.log('fetching init w id:', inputId);
        const res = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: inputId }),
        });
        const data = await res.json();
        console.log('data:', data);
        const entry = data.data;
        if (!idSet.current.has(entry.id)) {
          idSet.current.add(entry.id);
          recordFetched(entry);
        }
        setParent(entry);
        setExpandedEntries([]);
      } catch (error) {
        console.error('error fetching init:', error);
      }
    };
    fetchEntry();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-1">
      {parent && (
        <div className="mx-auto max-w-5xl">
          <PendingQueue idSet={idSet} />

          <ThreadEntry
            entry={parent}
            neighbors={neighbors}
            fetchNeighbors={fetchNeighbors}
            idSet={idSet}
            recordExpanded={recordExpanded}
            recordFetched={recordFetched}
            type="root"
            depth={0}
            maxDepth={8}
          />
        </div>
      )}
    </div>
  );
}
