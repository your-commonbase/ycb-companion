/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable tailwindcss/migration-from-tailwind-2 */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-alert */
/* eslint-disable jsx-a11y/control-has-associated-label */

'use client';

import { useRouter } from 'next/navigation';
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(false);
  const throttledRef = useRef(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    router.push(`/dashboard/entry/${id}`);
  };

  const handleMetadataClick = (metadata: any) => {
    setSelectedMetadata(metadata);
    setShowMetadataModal(true);
  };

  const closeMetadataModal = () => {
    setShowMetadataModal(false);
    setSelectedMetadata(null);
  };

  // Selection handlers
  const handleRowSelect = (entryId: string) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(entryId)) {
        newSelected.delete(entryId);
      } else {
        newSelected.add(entryId);
      }
      return newSelected;
    });
  };

  const filteredEntries = entries.filter((entry) => {
    if (hideEntriesWithComments) {
      // Hide entries that have comments (alias_ids)
      return (
        !entry.metadata?.alias_ids || entry.metadata.alias_ids.length === 0
      );
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedRows.size === filteredEntries.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredEntries.map((entry) => entry.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedRows.size} selected entries? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete entries in parallel
      const deletePromises = Array.from(selectedRows).map(async (entryId) => {
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: entryId }),
        });

        if (!response.ok) {
          console.error(`Failed to delete entry ${entryId}`);
          return false;
        }
        return true;
      });

      await Promise.all(deletePromises);

      // Remove deleted entries from the UI
      setEntries((prev) => prev.filter((entry) => !selectedRows.has(entry.id)));
      setSelectedRows(new Set());

      // Update pagination if needed
      if (pagination) {
        setPagination((prev) =>
          prev
            ? {
                ...prev,
                total: prev.total - selectedRows.size,
              }
            : null,
        );
      }
    } catch (derror) {
      console.error('Error deleting entries:', derror);
      alert('Some entries could not be deleted. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportToCsv = () => {
    if (selectedRows.size === 0) return;

    const selectedEntries = filteredEntries.filter((entry) =>
      selectedRows.has(entry.id),
    );

    // Create CSV content
    const headers = ['ID', 'Data', 'Metadata', 'Created At', 'Updated At'];
    const csvContent = [
      headers.join(','),
      ...selectedEntries.map((entry) =>
        [
          `"${entry.id}"`,
          `"${entry.data.replace(/"/g, '""')}"`,
          `"${JSON.stringify(entry.metadata || {}).replace(/"/g, '""')}"`,
          `"${entry.createdAt}"`,
          `"${entry.updatedAt}"`,
        ].join(','),
      ),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `entries_${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Handle background deletion when user routes away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDeleting && selectedRows.size > 0) {
        // Browser will show its own confirmation dialog
        return 'Deletion is in progress. Are you sure you want to leave?';
      }
      return undefined;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDeleting) {
        // Continue deletion in background when tab becomes hidden
        console.log('Tab hidden during deletion, continuing in background...');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDeleting, selectedRows.size]);

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      const isIndeterminate =
        selectedRows.size > 0 && selectedRows.size < filteredEntries.length;
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedRows.size, filteredEntries.length]);

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

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">
            {selectedRows.size} {selectedRows.size === 1 ? 'entry' : 'entries'}{' '}
            selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportToCsv}
              className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              type="button"
            >
              <svg
                className="mr-2 size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to CSV
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-b-2 border-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <svg
                    className="mr-2 size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="relative px-6 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    selectedRows.size === filteredEntries.length &&
                    filteredEntries.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
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
                <td className="relative px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedRows.has(entry.id)}
                    onChange={() => handleRowSelect(entry.id)}
                  />
                </td>
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
