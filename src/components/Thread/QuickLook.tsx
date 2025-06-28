'use client';

import { useCallback, useEffect, useState } from 'react';

import type { FlattenedEntry, QuickLookProps } from './types';

type TabType = 'neighbors' | 'thread' | 'current';

const QuickLook: React.FC<QuickLookProps> = ({ currentEntry, allEntries }) => {
  const [activeTab, setActiveTab] = useState<TabType>('neighbors');
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    neighbors: false,
    thread: false,
    current: false,
  });
  const [tabData, setTabData] = useState<Record<TabType, FlattenedEntry[]>>({
    neighbors: [],
    thread: [],
    current: [],
  });

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

  // Load Thread tab data (all ancestors and descendants)
  const loadThreadTabData = useCallback(async (): Promise<FlattenedEntry[]> => {
    const threadEntries = new Map<string, FlattenedEntry>();
    const processed = new Set<string>();

    // Helper function to fetch an entry by ID
    const fetchEntry = async (id: string): Promise<FlattenedEntry | null> => {
      try {
        const response = await fetch('/api/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        const responseData = await response.json();
        return {
          ...responseData.data,
          relationshipType: 'comment' as const,
          relationshipSource: currentEntry.id,
          level: 0,
          hasMoreRelations: true,
        };
      } catch (fetchError) {
        console.error('Error fetching entry:', fetchError);
        return null;
      }
    };

    // Recursively fetch all ancestors (parents)
    const fetchAncestors = async (entry: FlattenedEntry): Promise<void> => {
      if (processed.has(entry.id)) return;
      processed.add(entry.id);
      threadEntries.set(entry.id, entry);

      const parentId = entry.metadata?.parent_id;
      if (parentId && parentId.trim() !== '') {
        const parentEntry = await fetchEntry(parentId);
        if (parentEntry) {
          await fetchAncestors(parentEntry);
        }
      }
    };

    // Recursively fetch all descendants (comments)
    const fetchDescendants = async (entry: FlattenedEntry): Promise<void> => {
      if (processed.has(entry.id)) return;
      processed.add(entry.id);
      threadEntries.set(entry.id, entry);

      const aliasIds = entry.metadata?.alias_ids || [];
      // Use Promise.all to fetch children in parallel instead of await in loop
      const childPromises = aliasIds
        .filter(
          (aliasId: any): aliasId is string => typeof aliasId === 'string',
        )
        .map(async (aliasId: string) => {
          const childEntry = await fetchEntry(aliasId);
          if (childEntry) {
            await fetchDescendants(childEntry);
          }
        });

      await Promise.all(childPromises);
    };

    // Start with current entry and fetch both directions
    await fetchAncestors(currentEntry);
    await fetchDescendants(currentEntry);

    // Build hierarchy and assign levels
    const entriesArray = Array.from(threadEntries.values());
    const sortedEntries = entriesArray
      .map((entry) => {
        // Calculate depth level based on parent relationships
        let level = 0;
        let currentEntryId = entry.id;
        const visited = new Set<string>();

        while (currentEntryId && !visited.has(currentEntryId)) {
          visited.add(currentEntryId);
          // Store currentEntryId in a const to avoid closure issues
          const searchId = currentEntryId;
          const parentEntry = entriesArray.find((e) =>
            e.metadata?.alias_ids?.includes(searchId),
          );
          if (parentEntry) {
            level += 1;
            currentEntryId = parentEntry.id;
          } else {
            break;
          }
        }

        return { ...entry, level };
      })
      .sort((a, b) => {
        // First sort by level (depth), then by creation date
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        if (a.createdAt && b.createdAt) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return a.id.localeCompare(b.id);
      });

    return sortedEntries;
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

      return responseData.data
        .filter((entry: any) => entry.id !== currentEntry.id) // Exclude current entry
        .map((entry: any) => ({
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

  // Lazy load data for each tab
  const loadTabData = useCallback(
    async (tab: TabType) => {
      if (tabData[tab].length > 0) return; // Already loaded

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
          default: {
            throw new Error(`Unknown tab type: ${tab}`);
          }
        }

        setTabData((prev) => ({ ...prev, [tab]: newTabData }));
      } catch (loadError) {
        console.error(`Error loading ${tab} data:`, loadError);
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [tabData, loadCurrentTabData, loadThreadTabData, loadNeighborsTabData],
  );

  // Load neighbors tab data immediately when component mounts
  useEffect(() => {
    loadTabData('neighbors');
  }, [currentEntry.id, loadTabData]);

  // Load data when tab changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, loadTabData]);

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
                    <div className="text-xs text-gray-500">
                      ID: {entry.id.slice(0, 8)}...
                    </div>
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
                <div className="text-xs text-gray-500">
                  ID: {entry.id.slice(0, 8)}...
                </div>
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
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {renderTabContent(activeTab)}
      </div>
    </div>
  );
};

export default QuickLook;
