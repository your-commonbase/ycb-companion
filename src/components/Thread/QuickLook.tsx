'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { FlattenedEntry, QuickLookProps } from './types';

type TabType = 'neighbors' | 'thread' | 'current' | 'sources';

const QuickLook: React.FC<QuickLookProps> = ({ currentEntry, allEntries }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('neighbors');
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    neighbors: false,
    thread: false,
    current: false,
    sources: false,
  });
  const [tabData, setTabData] = useState<Record<TabType, FlattenedEntry[]>>({
    neighbors: [],
    thread: [],
    current: [],
    sources: [],
  });

  // Persistent tracking sets to prevent infinite loops - these persist across function calls
  const globalProcessedIds = useRef<Set<string>>(new Set());
  const globalFetchingIds = useRef<Set<string>>(new Set());
  const callCount = useRef<number>(0);
  const lastResetTime = useRef<number>(Date.now());

  // Sources pagination state
  const [sourcesPage, setSourcesPage] = useState(1);
  const [sourcesHasMore, setSourcesHasMore] = useState(true);
  const [sourcesLoadingMore, setSourcesLoadingMore] = useState(false);
  const [sourcesImageUrls, setSourcesImageUrls] = useState<{
    [id: string]: string;
  }>({});

  // Circuit breaker - reset if too many calls in short time
  const resetTrackingIfNeeded = () => {
    const now = Date.now();
    const timeSinceReset = now - lastResetTime.current;

    // Reset every 30 seconds or if call count exceeds 100
    if (timeSinceReset > 30000 || callCount.current > 100) {
      console.warn(
        'Circuit breaker: Resetting tracking sets to prevent infinite loops',
      );
      globalProcessedIds.current.clear();
      globalFetchingIds.current.clear();
      callCount.current = 0;
      lastResetTime.current = now;
    }

    callCount.current += 1;
  };

  // Load Current tab data (path to root)
  const loadCurrentTabData = useCallback(async (): Promise<
    FlattenedEntry[]
  > => {
    const path: FlattenedEntry[] = [];

    const buildPathRecursive = (
      entry: FlattenedEntry,
      visited = new Set<string>(),
    ): void => {
      if (visited.has(entry.id)) return;
      visited.add(entry.id);

      path.unshift(entry);

      if (entry.relationshipType === 'root') return;

      if (entry.relationshipSource) {
        const parentEntry = allEntries.find(
          (e) => e.id === entry.relationshipSource,
        );
        if (parentEntry) {
          buildPathRecursive(parentEntry, visited);
        } else {
          const rootEntry = allEntries.find(
            (e) => e.relationshipType === 'root',
          );
          if (rootEntry && !visited.has(rootEntry.id)) {
            path.unshift(rootEntry);
          }
        }
      }
    };

    buildPathRecursive(currentEntry);
    return path;
  }, [currentEntry, allEntries]);

  // Load Thread tab data (complete thread tree) - Build ID tree first, then fetch data
  const loadThreadTabData = useCallback(async (): Promise<FlattenedEntry[]> => {
    const startTime = Date.now();
    const TIMEOUT_MS = 10000; // 10 second timeout

    // Circuit breaker check
    resetTrackingIfNeeded();

    // Check if we've already built this tree recently
    if (globalProcessedIds.current.has(currentEntry.id)) {
      console.log(
        'Thread tree already built for this entry, skipping to prevent loops',
      );
      return [];
    }

    // Timeout wrapper function
    const checkTimeout = () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        throw new Error(
          `LoadThreadTabData timed out after ${TIMEOUT_MS}ms - possible infinite loop`,
        );
      }
    };

    // Step 1: Build complete ID tree structure using DFS
    const allThreadIds = new Set<string>();
    const parentChildMap = new Map<string, Set<string>>(); // parent -> children
    const childParentMap = new Map<string, string>(); // child -> parent
    // Use global tracking sets instead of local ones
    const processedIds = globalProcessedIds.current;
    const fetchingIds = globalFetchingIds.current;

    // Helper to fetch entry metadata only (minimal fetch)
    const fetchEntryMetadata = async (
      id: string,
    ): Promise<{ parent_id?: string; alias_ids?: any[] } | null> => {
      try {
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) return null;
        const responseData = await response.json();
        if (!responseData.data?.metadata) return null;

        return {
          parent_id: responseData.data.metadata.parent_id,
          alias_ids: responseData.data.metadata.alias_ids || [],
        };
      } catch (error) {
        console.error('Error fetching metadata:', error);
        return null;
      }
    };

    // DFS to build complete ID tree with depth limiting
    const buildIdTree = async (
      entryId: string,
      depth: number = 0,
    ): Promise<void> => {
      // Emergency circuit breaker - check call count and timeout
      checkTimeout();
      if (callCount.current > 50) {
        console.error(
          'EMERGENCY STOP: Too many buildIdTree calls, aborting to prevent crash',
        );
        return;
      }

      // Prevent extremely deep recursion
      const MAX_DEPTH = 20; // Reduced from 50 to be more conservative
      if (depth > MAX_DEPTH) {
        console.warn(
          `Max depth ${MAX_DEPTH} reached for entry ${entryId} at depth ${depth}`,
        );
        return;
      }

      // Check if already fully processed (using global set)
      if (processedIds.has(entryId)) {
        console.log(`Entry ${entryId} already processed, skipping`);
        return;
      }

      // Check if currently being processed (cycle detection using global set)
      if (fetchingIds.has(entryId)) {
        console.warn(
          `CYCLE DETECTED: ${entryId} is already being processed at depth ${depth}`,
        );
        return;
      }

      // Mark as currently being processed
      fetchingIds.add(entryId);
      allThreadIds.add(entryId);

      try {
        // Use current entry data if it's the starting entry
        let metadata;
        if (entryId === currentEntry.id) {
          metadata = {
            parent_id: currentEntry.metadata?.parent_id,
            alias_ids: currentEntry.metadata?.alias_ids || [],
          };
        } else {
          metadata = await fetchEntryMetadata(entryId);
          if (!metadata) return;
        }

        // Process parent relationship
        if (metadata.parent_id && metadata.parent_id.trim()) {
          const parentId = metadata.parent_id.trim();

          // Prevent self-reference cycles
          if (parentId !== entryId) {
            childParentMap.set(entryId, parentId);

            if (!parentChildMap.has(parentId)) {
              parentChildMap.set(parentId, new Set());
            }
            parentChildMap.get(parentId)!.add(entryId);

            // Recurse to parent only if not already processed or being processed
            if (!processedIds.has(parentId) && !fetchingIds.has(parentId)) {
              await buildIdTree(parentId, depth + 1);
            }
          }
        }

        // Process children relationships
        if (metadata.alias_ids && Array.isArray(metadata.alias_ids)) {
          const childIds = metadata.alias_ids
            .filter((id: any) => typeof id === 'string' && id.trim() !== '')
            .map((id: string) => id.trim())
            .filter((id: string) => id !== entryId); // Prevent self-reference

          if (!parentChildMap.has(entryId)) {
            parentChildMap.set(entryId, new Set());
          }

          for (const childId of childIds) {
            parentChildMap.get(entryId)!.add(childId);
            childParentMap.set(childId, entryId);

            // Recurse to child only if not already processed or being processed
            if (!processedIds.has(childId) && !fetchingIds.has(childId)) {
              // eslint-disable-next-line no-await-in-loop
              await buildIdTree(childId, depth + 1);
            }
          }
        }
      } finally {
        // Mark as fully processed and remove from fetching set
        processedIds.add(entryId);
        fetchingIds.delete(entryId);
      }
    };

    // Start building tree from current entry with error handling
    try {
      await buildIdTree(currentEntry.id);
    } catch (error) {
      console.error('Error building thread tree:', error);
      // Clear tracking sets and return empty result on error
      globalProcessedIds.current.clear();
      globalFetchingIds.current.clear();
      return [];
    }

    // Step 2: Find root of the tree with cycle protection
    let rootId = currentEntry.id;
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Prevent infinite while loop

    while (childParentMap.has(rootId) && iterations < MAX_ITERATIONS) {
      checkTimeout();
      const parentId = childParentMap.get(rootId);
      if (!parentId || rootId === parentId) break; // Prevent cycles
      rootId = parentId;
      iterations += 1;
    }

    if (iterations >= MAX_ITERATIONS) {
      console.warn('Max iterations reached while finding root, possible cycle');
    }

    // Step 3: Calculate levels using BFS from root
    const idLevels = new Map<string, number>();
    const queue: Array<{ id: string; level: number }> = [
      { id: rootId, level: 0 },
    ];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;

      // eslint-disable-next-line no-continue
      if (idLevels.has(id)) continue; // Already processed
      idLevels.set(id, level);

      // Add children to queue
      const children = parentChildMap.get(id) || new Set();
      for (const childId of children) {
        if (!idLevels.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }

    // Step 4: Fetch all entry data in parallel
    const threadEntries = new Map<string, FlattenedEntry>();
    threadEntries.set(currentEntry.id, currentEntry); // Use existing current entry

    const fetchPromises = Array.from(allThreadIds)
      .filter((id) => id !== currentEntry.id) // Don't refetch current entry
      .map(async (id) => {
        try {
          const response = await fetch('/api/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });

          if (!response.ok) return null;
          const responseData = await response.json();
          if (!responseData.data) return null;

          const entry: FlattenedEntry = {
            ...responseData.data,
            relationshipType: 'comment' as const,
            relationshipSource: '',
            level: idLevels.get(id) || 0,
            hasMoreRelations: true,
          };

          threadEntries.set(id, entry);
          return entry;
        } catch (error) {
          console.error(`Error fetching entry ${id}:`, error);
          return null;
        }
      });

    await Promise.all(fetchPromises);

    // Step 5: Create hierarchical order using DFS traversal
    const orderedEntries: FlattenedEntry[] = [];
    const visitedForOrder = new Set<string>();

    // DFS function to traverse tree in hierarchical order
    const traverseInOrder = (nodeId: string) => {
      if (visitedForOrder.has(nodeId)) return;
      visitedForOrder.add(nodeId);

      const entry = threadEntries.get(nodeId);
      if (entry) {
        orderedEntries.push({
          ...entry,
          level: idLevels.get(nodeId) || 0,
        });
      }

      // Get children and sort them by creation date
      const children = Array.from(parentChildMap.get(nodeId) || []);
      children.sort((a, b) => {
        const entryA = threadEntries.get(a);
        const entryB = threadEntries.get(b);
        if (entryA?.createdAt && entryB?.createdAt) {
          return (
            new Date(entryA.createdAt).getTime() -
            new Date(entryB.createdAt).getTime()
          );
        }
        return a.localeCompare(b);
      });

      // Recursively traverse children
      children.forEach(traverseInOrder);
    };

    // Start traversal from root
    traverseInOrder(rootId);

    return orderedEntries;
  }, [currentEntry]);

  // Load Neighbors tab data (semantic search)
  const loadNeighborsTabData = useCallback(async (): Promise<
    FlattenedEntry[]
  > => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: currentEntry.id }),
      });
      const responseData = await response.json();

      // Filter out current entry
      const filteredResults = responseData.data.filter(
        (entry: any) => entry.id !== currentEntry.id,
      );

      // If no results after filtering, return empty array
      // This prevents infinite loops when search only returns current entry
      if (filteredResults.length === 0) {
        return [];
      }

      return filteredResults.map((entry: any) => ({
        ...entry,
        relationshipType: 'neighbor' as const,
        relationshipSource: currentEntry.id,
        level: 0,
        hasMoreRelations: true,
      }));
    } catch (neighborsError) {
      console.error('Error fetching neighbors:', neighborsError);
      return [];
    }
  }, [currentEntry.id]);

  // Load Sources tab data (entries from the same author)
  const loadSourcesTabData = useCallback(
    async (page: number = 1): Promise<FlattenedEntry[]> => {
      if (!currentEntry.metadata?.author) {
        return [];
      }

      try {
        const response = await fetch('/api/listByAuthor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: currentEntry.metadata.author,
            page,
            limit: 50,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sources');
        }

        const responseData = await response.json();
        const entries = responseData.data || [];

        // Filter out current entry
        const filteredEntries = entries.filter(
          (entry: any) => entry.id !== currentEntry.id,
        );

        // Check if we have more pages
        const hasMore = entries.length === 50; // If we got a full page, there might be more
        setSourcesHasMore(hasMore);

        // Load images for image entries
        const imageEntries = filteredEntries.filter(
          (entry: any) => entry.metadata?.type === 'image',
        );
        if (imageEntries.length > 0) {
          const imageIds = imageEntries.map((entry: any) => entry.id);
          try {
            const imageResponse = await fetch('/api/fetchImageByIDs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: imageIds }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const newImageUrls = imageData.data.body.urls || {};
              setSourcesImageUrls((prev) => ({ ...prev, ...newImageUrls }));
            }
          } catch (imageError) {
            console.error('Error fetching images for sources:', imageError);
          }
        }

        // Return entries with source relationship type
        return filteredEntries.map((entry: any) => ({
          ...entry,
          relationshipType: 'source' as const,
          relationshipSource: currentEntry.metadata?.author || '',
          level: 0,
          hasMoreRelations: false,
        }));
      } catch (sourcesError) {
        console.error('Error fetching sources:', sourcesError);
        setSourcesHasMore(false);
        return [];
      }
    },
    [currentEntry.id, currentEntry.metadata?.author],
  );

  // Load more sources (for infinite scroll)
  const loadMoreSources = useCallback(async () => {
    if (sourcesLoadingMore || !sourcesHasMore || loading.sources) {
      return;
    }

    setSourcesLoadingMore(true);
    try {
      const nextPage = sourcesPage + 1;
      const newEntries = await loadSourcesTabData(nextPage);

      if (newEntries.length > 0) {
        setTabData((prev) => ({
          ...prev,
          sources: [...prev.sources, ...newEntries],
        }));
        setSourcesPage(nextPage);
      } else {
        setSourcesHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more sources:', error);
      setSourcesHasMore(false);
    } finally {
      setSourcesLoadingMore(false);
    }
  }, [
    sourcesPage,
    sourcesHasMore,
    sourcesLoadingMore,
    loading.sources,
    loadSourcesTabData,
  ]);

  // Lazy load data for each tab
  const loadTabData = useCallback(
    async (tab: TabType) => {
      // Prevent multiple calls by checking if already loading or has data
      if (loading[tab]) {
        console.log(`Already loading ${tab}, skipping`);
        return;
      }

      if (tabData[tab].length > 0) {
        console.log(`${tab} already has data, skipping`);
        return;
      }

      console.log(`Loading ${tab} data`);
      setLoading((prev) => ({ ...prev, [tab]: true }));

      try {
        let newTabData: FlattenedEntry[] = [];

        switch (tab) {
          case 'current': {
            newTabData = await loadCurrentTabData();
            break;
          }
          case 'thread': {
            newTabData = await loadThreadTabData();
            break;
          }
          case 'neighbors': {
            newTabData = await loadNeighborsTabData();
            break;
          }
          case 'sources': {
            newTabData = await loadSourcesTabData(1);
            break;
          }
          default: {
            throw new Error(`Unknown tab type: ${tab}`);
          }
        }

        console.log(`${tab} loaded ${newTabData.length} entries`);
        setTabData((prev) => ({ ...prev, [tab]: newTabData }));
      } catch (loadError) {
        console.error(`Error loading ${tab} data:`, loadError);
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [], // Remove all dependencies to prevent re-creation
  );

  // Reset tracking when current entry changes to prevent stale data
  useEffect(() => {
    console.log('Current entry changed, clearing tracking sets');
    globalProcessedIds.current.clear();
    globalFetchingIds.current.clear();
    callCount.current = 0;
    lastResetTime.current = Date.now();

    // Clear tab data for fresh start
    setTabData({
      neighbors: [],
      thread: [],
      current: [],
      sources: [],
    });

    // Reset sources pagination state
    setSourcesPage(1);
    setSourcesHasMore(true);
    setSourcesLoadingMore(false);
    setSourcesImageUrls({});

    // Load neighbors tab data for new entry
    loadTabData('neighbors');
  }, [currentEntry.id]); // Remove loadTabData dependency to prevent loops

  // Load data when tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab]); // Remove loadTabData dependency to prevent loops

  const getRelationshipInfo = (
    entry: FlattenedEntry,
    index: number,
    tabType: TabType,
  ) => {
    if (tabType === 'current') {
      if (index === 0)
        return {
          label: 'Root',
          color: 'bg-green-500',
          description: 'Original thread entry',
        };
      if (index === tabData.current.length - 1)
        return {
          label: 'Current',
          color: 'bg-blue-500',
          description: 'Selected entry',
        };
    }

    switch (entry.relationshipType) {
      case 'parent':
        return {
          label: 'Parent',
          color: 'bg-purple-500',
          description: 'Parent entry',
        };
      case 'comment': {
        const hasScore = entry.similarity !== undefined;
        return {
          label: hasScore ? 'Similar' : 'Comment',
          color: hasScore ? 'bg-orange-500' : 'bg-orange-400',
          description: hasScore
            ? `Similarity: ${(entry.similarity! * 100).toFixed(1)}%`
            : 'Comment entry',
        };
      }
      case 'neighbor': {
        const neighborScore = entry.similarity !== undefined;
        return {
          label: neighborScore ? 'Related' : 'Neighbor',
          color: neighborScore ? 'bg-green-600' : 'bg-green-400',
          description: neighborScore
            ? `Similarity: ${(entry.similarity! * 100).toFixed(1)}%`
            : 'Neighbor entry',
        };
      }
      case 'source': {
        return {
          label: 'Source',
          color: 'bg-indigo-500',
          description: 'From same author',
        };
      }
      default:
        return {
          label: 'Entry',
          color: 'bg-gray-400',
          description: 'Thread entry',
        };
    }
  };

  const renderTabContent = (tabType: TabType) => {
    if (loading[tabType]) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="size-6 animate-spin rounded-full border-b-2 border-blue-500" />
          <span className="ml-2 text-sm text-gray-600">
            Loading {tabType}...
          </span>
        </div>
      );
    }

    if (tabData[tabType].length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <span>No {tabType} entries found</span>
        </div>
      );
    }

    // Special handling for sources tab with infinite scroll
    if (tabType === 'sources') {
      return (
        <div className="space-y-2">
          {tabData[tabType].map((entry, index) => {
            const relationshipInfo = getRelationshipInfo(entry, index, tabType);

            return (
              <div
                key={entry.id}
                className={`border-l-4 pl-4 ${relationshipInfo.color.replace(
                  'bg-',
                  'border-',
                )}`}
              >
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className={`size-3 rounded-full ${relationshipInfo.color}`}
                  />
                  <span
                    className={`rounded-full px-2 py-1 text-xs text-white ${relationshipInfo.color}`}
                  >
                    {relationshipInfo.label}
                  </span>
                  <button
                    onClick={() => router.push(`/dashboard/entry/${entry.id}`)}
                    className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    type="button"
                  >
                    ID: {entry.id.slice(0, 8)}...
                  </button>
                  {entry.createdAt && (
                    <div className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Show image if entry is an image type */}
                {entry.metadata?.type === 'image' &&
                  sourcesImageUrls[entry.id] && (
                    <div className="mb-2">
                      <img
                        src={sourcesImageUrls[entry.id]}
                        alt="Entry preview"
                        className="h-32 w-auto rounded object-cover"
                      />
                    </div>
                  )}

                <div className="mb-2 text-xs text-gray-600">
                  {relationshipInfo.description}
                </div>

                <div className="mb-3">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                    {entry.data}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more button for sources */}
          {sourcesHasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMoreSources}
                disabled={sourcesLoadingMore}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                type="button"
              >
                {sourcesLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 animate-spin rounded-full border-b-2 border-gray-600" />
                    Loading more...
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tabData[tabType].map((entry, index) => {
          const relationshipInfo = getRelationshipInfo(entry, index, tabType);

          // For thread tab, use Reddit-style indentation
          if (tabType === 'thread') {
            const indentLevel = Math.min(entry.level || 0, 10); // Cap at 10 levels
            const indentPx = indentLevel * 20; // 20px per level

            return (
              <div
                key={entry.id}
                className="border-l-2 border-gray-200 py-2"
                style={{ marginLeft: `${indentPx}px` }}
              >
                <div className="pl-4">
                  <div className="mb-2 flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/entry/${entry.id}`)
                      }
                      className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      type="button"
                    >
                      ID: {entry.id.slice(0, 8)}...
                    </button>
                    {entry.createdAt && (
                      <div className="text-xs text-gray-400">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                      {entry.data}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // For current and neighbors tabs, use original design
          return (
            <div
              key={entry.id}
              className={`border-l-4 pl-4 ${relationshipInfo.color.replace(
                'bg-',
                'border-',
              )}`}
            >
              <div className="mb-2 flex items-center gap-3">
                <div
                  className={`size-3 rounded-full ${relationshipInfo.color}`}
                />
                {tabType === 'current' && (
                  <span className="text-sm font-medium text-gray-600">
                    Level {entry.level}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-1 text-xs text-white ${relationshipInfo.color}`}
                >
                  {relationshipInfo.label}
                </span>
                <button
                  onClick={() => router.push(`/dashboard/entry/${entry.id}`)}
                  className="cursor-pointer text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  type="button"
                >
                  ID: {entry.id.slice(0, 8)}...
                </button>
              </div>

              <div className="mb-2 text-xs text-gray-600">
                {relationshipInfo.description}
              </div>

              <div className="mb-3">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                  {entry.data}
                </div>
              </div>

              {tabType === 'current' && index < tabData.current.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      className="size-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span>leads to</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab Navigation */}
      <div className="mb-4 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('neighbors')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'neighbors'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          type="button"
        >
          Neighbors
        </button>
        <button
          onClick={() => setActiveTab('thread')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'thread'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          type="button"
        >
          Thread
        </button>
        <button
          onClick={() => setActiveTab('current')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'current'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          type="button"
        >
          Current
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'sources'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          type="button"
        >
          Sources
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
};

export default QuickLook;
