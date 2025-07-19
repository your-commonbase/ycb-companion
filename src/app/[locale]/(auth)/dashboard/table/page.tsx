/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable tailwindcss/migration-from-tailwind-2 */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Entry {
  id: string;
  data: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const TablePage = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isThrottled, setIsThrottled] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedMetadata, setSelectedMetadata] = useState<any>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [hideEntriesWithComments, setHideEntriesWithComments] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);
  const throttledRef = useRef(false);
  // const router = useRouter();

  const fetchImageUrls = useCallback(async (imageIds: string[]) => {
    try {
      const response = await fetch('/api/fetchImageByIDs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: imageIds,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const { urls } = result.data.body;
        setImageUrls((prev) => ({ ...prev, ...urls }));
      }
    } catch (ierror) {
      console.error('Failed to fetch image URLs:', ierror);
    }
  }, []);

  const fetchEntries = useCallback(
    async (page: number = 1, append: boolean = false) => {
      // Check current state using refs
      if (loadingRef.current || throttledRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page,
            limit: 50,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch entries');
        }

        const result = await response.json();
        const { records, pagination: paginationInfo } = result.data;

        if (append) {
          setEntries((prev) => [...prev, ...records]);
        } else {
          setEntries(records);
        }

        setPagination(paginationInfo);
        setHasMoreData(paginationInfo.hasNextPage);

        // Fetch image URLs for image entries
        const imageEntries = records.filter(
          (entry: Entry) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          fetchImageUrls(imageEntries.map((entry: Entry) => entry.id));
        }

        // Add throttling to prevent rapid successive calls
        throttledRef.current = true;
        setIsThrottled(true);
        setTimeout(() => {
          throttledRef.current = false;
          setIsThrottled(false);
        }, 1000); // 1 second throttle
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!hasInitialized) {
      fetchEntries(1, false);
      setHasInitialized(true);
    }
  }, [fetchEntries, hasInitialized]);

  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce scroll events
    scrollTimeoutRef.current = setTimeout(() => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (
          hasMoreData &&
          !loading &&
          !isThrottled &&
          pagination?.hasNextPage
        ) {
          fetchEntries(pagination.page + 1, true);
        }
      }
    }, 300); // 300ms debounce
  }, [hasMoreData, loading, isThrottled, pagination, fetchEntries]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata || typeof metadata !== 'object') return '';

    const keys = Object.keys(metadata);
    if (keys.length === 0) return '';

    return keys
      .slice(0, 3)
      .map((key) => `${key}: ${metadata[key]}`)
      .join(', ');
  };

  const handleEntryClick = (id: string) => {
    window.open(`/dashboard/entry/${id}`);
  };

  const handleMetadataClick = (metadata: any) => {
    setSelectedMetadata(metadata);
    setShowMetadataModal(true);
  };

  const closeMetadataModal = () => {
    setShowMetadataModal(false);
    setSelectedMetadata(null);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMetadataModal) {
        closeMetadataModal();
      }
    };

    if (showMetadataModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (showMetadataModal) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [showMetadataModal]);

  const filteredEntries = entries.filter((entry) => {
    if (hideEntriesWithComments) {
      // Hide entries that have comments (alias_ids)
      return (
        !entry.metadata?.alias_ids || entry.metadata.alias_ids.length === 0
      );
    }
    return true;
  });

  const renderDataCell = (entry: Entry) => {
    if (entry.metadata?.type === 'image') {
      const imageUrl = imageUrls[entry.id];
      if (imageUrl) {
        return (
          <div className="flex items-center gap-3">
            <img
              src={imageUrl}
              alt="Entry content"
              className="size-12 rounded object-cover"
            />
            <div className="max-w-xs truncate text-sm text-gray-900">
              {entry.data}
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded bg-gray-100">
            <svg
              className="size-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="max-w-xs truncate text-sm text-gray-900">
            {entry.data}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-md truncate text-sm text-gray-900">
        {entry.data}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h2 className="font-semibold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Entries Table</h1>

      <div className="mb-4 flex items-center justify-between">
        <div>
          {pagination && (
            <div className="text-sm text-gray-600">
              Showing {filteredEntries.length} of {entries.length} entries
              {hideEntriesWithComments && ' (filtered)'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="hide-comments-filter"
            className="flex items-center gap-2 text-sm"
          >
            <input
              id="hide-comments-filter"
              type="checkbox"
              checked={hideEntriesWithComments}
              onChange={(e) => setHideEntriesWithComments(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Hide entries with comments
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Metadata
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <button
                    onClick={() => handleEntryClick(entry.id)}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    type="button"
                  >
                    {entry.id.slice(0, 8)}...
                  </button>
                </td>
                <td className="px-6 py-4">{renderDataCell(entry)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleMetadataClick(entry.metadata)}
                    className="max-w-md truncate text-left text-sm text-gray-500 hover:text-gray-700 hover:underline"
                    type="button"
                  >
                    {formatMetadata(entry.metadata)}
                  </button>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(entry.createdAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(entry.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
            <span className="text-sm text-gray-600">
              Loading more entries...
            </span>
          </div>
        </div>
      )}

      {!hasMoreData && entries.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          No more entries to load
        </div>
      )}

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeMetadataModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="metadata-modal-title"
        >
          <div
            className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="metadata-modal-title" className="text-lg font-semibold">
                Metadata JSON
              </h2>
              <button
                onClick={closeMetadataModal}
                className="text-gray-500 hover:text-gray-700"
                type="button"
                aria-label="Close metadata modal"
              >
                <svg
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <textarea
              value={JSON.stringify(selectedMetadata, null, 2)}
              readOnly
              className="h-80 w-full rounded border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="No metadata available"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={closeMetadataModal}
                className="rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablePage;
