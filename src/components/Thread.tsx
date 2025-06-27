'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import PendingQueue from '@/components/PendingQueue';
import { fetchRandomEntry } from '@/helpers/functions';
import { useAddQueueProcessor } from '@/hooks/useAddQueue';
import { useAutoScrollMode } from '@/hooks/useAutoScrollMode';

import SearchModalBeta from './SearchModalBeta';
import ThreadEntryCard from './Thread/ThreadEntryCard';
import TreePathDisplay from './Thread/TreePathDisplay';
import type { Entry, FlattenedEntry } from './Thread/types';
import TreeMinimap from './TreeMinimap';

export default function Thread({ inputId }: { inputId: string }) {
  const [flattenedEntries, setFlattenedEntries] = useState<FlattenedEntry[]>(
    [],
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedRelationships, setExpandedRelationships] = useState<
    Set<string>
  >(new Set());
  const [loadingRelationships, setLoadingRelationships] = useState<Set<string>>(
    new Set(),
  );
  const [, setProcessingImages] = useState<Set<string>>(new Set());
  const [, setProcessingUrls] = useState<Set<string>>(new Set());
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isExpansionBlocking, setIsExpansionBlocking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [treeModalEntry, setTreeModalEntry] = useState<FlattenedEntry | null>(
    null,
  );
  const idSet = useRef(new Set<string>());
  const router = useRouter();
  const { autoScrollMode, maxDepth } = useAutoScrollMode();
  const processedEntries = useRef(new Set<string>());
  useAddQueueProcessor();

  const flattenEntry = (
    entry: Entry,
    relationshipType: 'root' | 'parent' | 'comment' | 'neighbor',
    level: number = 0,
    relationshipSource?: string,
  ): FlattenedEntry => {
    console.log(
      `Creating ${relationshipType} entry: ${entry.id} at level ${level} (maxDepth: ${maxDepth})`,
    );
    return {
      ...entry,
      relationshipType,
      relationshipSource,
      level,
      hasMoreRelations: true, // All entries can have related/neighbor entries
    };
  };

  const findNextUnexploredEntry = (
    currentEntry: FlattenedEntry,
  ): FlattenedEntry | null => {
    // Find the next entry that hasn't been processed and has potential relationships
    // First, look for entries at lower levels (going back up the tree)
    for (
      let targetLevel = currentEntry.level - 1;
      targetLevel >= 0;
      targetLevel -= 1
    ) {
      const candidateEntries = flattenedEntries.filter(
        (entry) =>
          entry.level === targetLevel &&
          !processedEntries.current.has(entry.id) &&
          (entry.hasMoreRelations ||
            (entry.metadata.alias_ids && entry.metadata.alias_ids.length > 0) ||
            (entry.metadata.parent_id &&
              !idSet.current.has(entry.metadata.parent_id))),
      );

      if (candidateEntries.length > 0) {
        // Return the first unexplored entry at this level
        return candidateEntries[0] || null;
      }
    }

    // If no entries found at lower levels, look for any unexplored entries
    const unexploredEntries = flattenedEntries.filter(
      (entry) =>
        !processedEntries.current.has(entry.id) &&
        (entry.hasMoreRelations ||
          (entry.metadata.alias_ids && entry.metadata.alias_ids.length > 0) ||
          (entry.metadata.parent_id &&
            !idSet.current.has(entry.metadata.parent_id))),
    );

    return unexploredEntries.length > 0 ? unexploredEntries[0] || null : null;
  };

  const expandAllRelationships = async (
    entryId: string,
    relationshipTypes: string[],
  ) => {
    // Find the current entry to check its level
    const currentEntry = flattenedEntries.find((e) => e.id === entryId);
    if (!currentEntry) {
      console.log(`Entry not found for expansion: ${entryId}`);
      return;
    }

    console.log(
      `Attempting to expand relationships for ${entryId} at level ${currentEntry.level}:`,
      relationshipTypes,
    );

    // Check if current entry level equals or exceeds maxDepth
    if (currentEntry.level >= maxDepth) {
      console.log(
        `Entry level ${currentEntry.level} equals/exceeds maxDepth ${maxDepth}, finding next unexplored entry`,
      );

      // Find next unexplored entry using DFS-like navigation
      const nextEntry = findNextUnexploredEntry(currentEntry);
      if (nextEntry) {
        console.log(
          `Found unexplored ancestor: ${nextEntry.id} at level ${nextEntry.level}`,
        );

        // Don't scroll to the ancestor - it's jarring since it's an old node
        // Instead, expand its relationships silently and let normal auto-scroll handle new nodes

        // Process the ancestor's relationships to create new children
        const relationshipsToExpand = [
          'comments',
          'parent',
          'neighbors',
        ].filter((type) => {
          if (type === 'comments' && nextEntry.metadata.alias_ids?.length > 0)
            return true;
          if (type === 'parent' && nextEntry.metadata.parent_id) return true;
          if (type === 'neighbors' && nextEntry.hasMoreRelations) return true;
          return false;
        });

        if (relationshipsToExpand.length > 0) {
          console.log(
            `Expanding ancestor relationships for: ${nextEntry.id}`,
            relationshipsToExpand,
          );
          // Expand relationships which will create new entries
          // The normal auto-scroll mechanism will handle scrolling to new entries
          expandAllRelationships(nextEntry.id, relationshipsToExpand);
        }
      }
      return; // Exit early when depth exceeded
    }

    // Prevent expansion if any relationships are already loading or expanded
    const alreadyProcessed = relationshipTypes.some((type) => {
      const relationshipKey = `${entryId}-${type}`;
      const isExpanded = expandedRelationships.has(relationshipKey);
      const isLoading = loadingRelationships.has(relationshipKey);
      if (isExpanded || isLoading) {
        console.log(
          `Skipping ${type} for ${entryId}: expanded=${isExpanded}, loading=${isLoading}`,
        );
      }
      return isExpanded || isLoading;
    });

    if (alreadyProcessed) {
      console.log(
        `All relationships already processed for ${entryId}:`,
        relationshipTypes,
      );
      return;
    }

    // Mark all relationships as loading and expanded
    const relationshipKeys = relationshipTypes.map(
      (type) => `${entryId}-${type}`,
    );
    setLoadingRelationships((prev) => {
      const newSet = new Set(prev);
      relationshipKeys.forEach((key) => newSet.add(key));
      return newSet;
    });
    setExpandedRelationships((prev) => {
      const newSet = new Set(prev);
      relationshipKeys.forEach((key) => newSet.add(key));
      return newSet;
    });
    setLoadingMore(true);
    setIsExpansionBlocking(true);

    try {
      const currentEntryTry = flattenedEntries.find((e) => e.id === entryId);
      if (!currentEntryTry) return;

      const currentIndex = flattenedEntries.findIndex((e) => e.id === entryId);
      const allNewEntries: FlattenedEntry[] = [];

      // Start all fetches simultaneously
      const fetchPromises = relationshipTypes.map(async (type) => {
        const newEntries: FlattenedEntry[] = [];

        if (type === 'parent' && currentEntryTry.metadata.parent_id) {
          const parentId = currentEntryTry.metadata.parent_id;
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
              currentEntryTry.level + 1,
              entryId,
            );
            console.log(
              `Adding parent ${parentEntry.id} at level ${parentEntry.level} for child ${entryId} at level ${currentEntryTry.level}`,
            );
            newEntries.push(parentEntry);
            idSet.current.add(parentId);
          }
        }

        if (type === 'comments' && currentEntryTry.metadata.alias_ids) {
          const aliasIds = currentEntryTry.metadata.alias_ids;
          const commentPromises = aliasIds.map(async (aliasId: any) => {
            if (!idSet.current.has(aliasId)) {
              try {
                const res = await fetch('/api/fetch', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ id: aliasId }),
                });
                const data = await res.json();
                const commentEntry = flattenEntry(
                  data.data,
                  'comment',
                  currentEntryTry.level + 1,
                  entryId,
                );
                idSet.current.add(aliasId);
                return commentEntry;
              } catch (error) {
                console.error('Error fetching comment:', error);
                return null;
              }
            }
            return null;
          });
          const comments = await Promise.all(commentPromises);
          newEntries.push(...(comments.filter(Boolean) as FlattenedEntry[]));
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
                  currentEntryTry.level + 1,
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

        return newEntries;
      });

      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);
      results.forEach((entries) => allNewEntries.push(...entries));

      // Insert all new entries after the current entry (downward scrolling)
      setFlattenedEntries((prev) => [
        ...prev.slice(0, currentIndex + 1),
        ...allNewEntries,
        ...prev.slice(currentIndex + 1),
      ]);
    } catch (error) {
      console.error('Error expanding relationships:', error);
    } finally {
      // Remove loading state for all relationships
      setLoadingRelationships((prev) => {
        const newSet = new Set(prev);
        relationshipKeys.forEach((key) => newSet.delete(key));
        return newSet;
      });
      setLoadingMore(false);
      setIsExpansionBlocking(false);
      processedEntries.current.clear();
    }
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const expandRelationships = async (
    entryId: string,
    type: 'parent' | 'comments' | 'neighbors',
  ) => {
    // For single relationship expansion, use the new function
    await expandAllRelationships(entryId, [type]);
  };

  const scrollToEntry = (index: number, shouldExpand: boolean = true) => {
    const entry = flattenedEntries[index];
    if (!entry) return;

    const element = document.getElementById(`entry-${entry.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Trigger relationship expansion for this entry only when explicitly requested
      if (
        shouldExpand &&
        autoScrollMode &&
        !processedEntries.current.has(entry.id)
      ) {
        processedEntries.current.add(entry.id);

        const relationshipsToExpand = [];

        // Check for comments
        const aliasIds = entry.metadata.alias_ids || [];
        if (
          aliasIds.length > 0 &&
          aliasIds.some((id: string) => !idSet.current.has(id))
        ) {
          const commentsKey = `${entry.id}-comments`;
          if (
            !expandedRelationships.has(commentsKey) &&
            !loadingRelationships.has(commentsKey)
          ) {
            relationshipsToExpand.push('comments');
          }
        }

        // Check for parent
        const parentId = entry.metadata.parent_id;
        if (
          parentId &&
          parentId.trim() !== '' &&
          !idSet.current.has(parentId)
        ) {
          const parentKey = `${entry.id}-parent`;
          if (
            !expandedRelationships.has(parentKey) &&
            !loadingRelationships.has(parentKey)
          ) {
            relationshipsToExpand.push('parent');
          }
        }

        // Check for neighbors
        if (entry.hasMoreRelations) {
          const neighborsKey = `${entry.id}-neighbors`;
          if (
            !expandedRelationships.has(neighborsKey) &&
            !loadingRelationships.has(neighborsKey)
          ) {
            relationshipsToExpand.push('neighbors');
          }
        }

        if (relationshipsToExpand.length > 0) {
          // maxDepth check is handled inside expandAllRelationships
          expandAllRelationships(entry.id, relationshipsToExpand);
        }
      }
    }
  };

  const handleNextEntry = () => {
    const nextIndex = Math.min(
      currentEntryIndex + 1,
      flattenedEntries.length - 1,
    );
    if (nextIndex !== currentEntryIndex && flattenedEntries.length > 1) {
      setCurrentEntryIndex(nextIndex);
      scrollToEntry(nextIndex);
    } else if (flattenedEntries.length === 1 && currentEntryIndex === 0) {
      // For the root entry, trigger expansion to load more entries
      scrollToEntry(0);
    }
  };

  const handlePrevEntry = () => {
    const prevIndex = Math.max(currentEntryIndex - 1, 0);
    if (prevIndex !== currentEntryIndex) {
      setCurrentEntryIndex(prevIndex);
      scrollToEntry(prevIndex);
    }
  };

  // Desktop keyboard navigation
  useEffect(() => {
    if (isMobile || isExpansionBlocking) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'textarea'
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(
          currentEntryIndex + 1,
          flattenedEntries.length - 1,
        );
        if (nextIndex !== currentEntryIndex && flattenedEntries.length > 1) {
          setCurrentEntryIndex(nextIndex);
          scrollToEntry(nextIndex);
        } else if (flattenedEntries.length === 1 && currentEntryIndex === 0) {
          // For the root entry, trigger expansion to load more entries
          scrollToEntry(0);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentEntryIndex - 1, 0);
        if (prevIndex !== currentEntryIndex) {
          setCurrentEntryIndex(prevIndex);
          scrollToEntry(prevIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMobile,
    isExpansionBlocking,
    currentEntryIndex,
    flattenedEntries.length,
    autoScrollMode,
    expandedRelationships,
    loadingRelationships,
  ]);

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

  const pollUrlProcessing = async (entryId: string) => {
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

        // Check if URL processing is complete - look for validated format
        // Unvalidated: data starts with "URL: https://..."
        // Validated: data has title, description, and structured content
        if (
          data.data &&
          data.data.data &&
          !data.data.data.startsWith('URL: ')
        ) {
          // URL processing is complete, update the entry
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
          setProcessingUrls((prev) => {
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
          setProcessingUrls((prev) => {
            const newSet = new Set(prev);
            newSet.delete(entryId);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error polling URL processing:', error);
        setProcessingUrls((prev) => {
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

  const handleUrlUpload = (result: any, parentId: string) => {
    // Find the parent entry to get its level
    const parentEntry = flattenedEntries.find((e) => e.id === parentId);
    if (!parentEntry) return;

    // Check if the returned data starts with "URL: " (unvalidated state)
    const isProcessing = result.data && result.data.startsWith('URL: ');

    const newEntry: FlattenedEntry = {
      id: result.id,
      data: result.data || '',
      comments: [],
      createdAt: result.createdAt || new Date().toISOString(),
      metadata: {
        ...result.metadata,
        parent_id: parentId,
      },
      relationshipType: 'comment',
      relationshipSource: parentId,
      level: parentEntry.level + 1,
      hasMoreRelations: true,
      isProcessing,
    };

    handleAddNewEntry(newEntry, parentId);

    // Start polling if the URL is still being processed
    if (isProcessing) {
      setProcessingUrls((prev) => new Set([...prev, result.id]));
      pollUrlProcessing(result.id);
    }
  };

  const handleTreeNodeClick = (entryId: string) => {
    const targetElement = document.getElementById(`entry-${entryId}`);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      // Add a brief highlight effect
      targetElement.style.transition = 'background-color 0.3s ease';
      targetElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      setTimeout(() => {
        targetElement.style.backgroundColor = '';
      }, 1000);

      // Update current entry index
      const entryIndex = flattenedEntries.findIndex((e) => e.id === entryId);
      if (entryIndex !== -1) {
        setCurrentEntryIndex(entryIndex);
      }
    }
  };

  const handleOpenTreeModal = (entry: FlattenedEntry) => {
    setTreeModalEntry(entry);
    setIsTreeModalOpen(true);
  };

  const handleCardClick = (entryId: string) => {
    const entryIndex = flattenedEntries.findIndex((e) => e.id === entryId);
    if (entryIndex !== -1) {
      setCurrentEntryIndex(entryIndex);
    }
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

        const rootEntry = flattenEntry(data.data, 'root', 1);
        setFlattenedEntries([rootEntry]);
        idSet.current.add(data.data.id);
      } catch (error) {
        console.error('Error fetching initial entry:', error);
      }
    };

    fetchInitialEntry();
  }, [inputId]);

  // Track current entry index based on scroll position (without triggering expansions)
  useEffect(() => {
    if (!isMobile) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        flattenedEntries.forEach((entry, index) => {
          const entryElement = document.getElementById(`entry-${entry.id}`);
          if (!entryElement) return;

          const rect = entryElement.getBoundingClientRect();
          const viewportCenter = window.innerHeight / 2;
          const hasPassedLine =
            rect.top < viewportCenter && rect.bottom > viewportCenter;

          // Update current entry index when this entry is in the center
          if (hasPassedLine && index !== currentEntryIndex) {
            setCurrentEntryIndex(index);
          }
        });
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // eslint-disable-next-line
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [flattenedEntries, isMobile, currentEntryIndex]);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
      style={{
        scrollSnapType: isMobile ? 'y mandatory' : 'none',
        overflow: isExpansionBlocking ? 'hidden' : 'auto',
      }}
    >
      {/* Scroll blocking indicator */}
      {isExpansionBlocking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg bg-white px-6 py-4 shadow-xl">
            <div className="size-6 animate-spin rounded-full border-b-2 border-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Loading relationships...
            </span>
          </div>
        </div>
      )}

      {/* Small loading indicator in bottom left corner */}
      {loadingMore && !isExpansionBlocking && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-lg">
          <div className="size-4 animate-spin rounded-full border-b-2 border-blue-500" />
          <span className="text-xs text-gray-600">Loading...</span>
        </div>
      )}
      <div className="w-full">
        <div className="mx-auto max-w-2xl">
          <PendingQueue idSet={idSet} />
        </div>

        {/* Thread entries - snap scroll full page chunks */}
        <div>
          {flattenedEntries.map((entry, index) => (
            <div
              key={`snap-${entry.id}`}
              id={`entry-${entry.id}`}
              className={`relative flex items-start justify-center px-6 ${
                isMobile ? 'h-screen py-4' : 'min-h-screen py-8'
              }`}
              style={{
                scrollSnapAlign: isMobile ? 'start' : 'none',
                maxHeight: '100vh',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              {/* Tap zones for navigation - now works on both mobile and desktop */}
              {/* Left tap zone for previous */}
              <button
                type="button"
                className="absolute left-0 top-0 z-10 h-full w-16 cursor-pointer bg-transparent"
                onClick={handlePrevEntry}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePrevEntry();
                  }
                }}
                aria-label="Go to previous entry"
                style={{ touchAction: 'manipulation' }}
              />
              {/* Right tap zone for next */}
              <button
                type="button"
                className="absolute right-0 top-0 z-10 h-full w-16 cursor-pointer bg-transparent"
                onClick={handleNextEntry}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNextEntry();
                  }
                }}
                aria-label="Go to next entry"
                style={{ touchAction: 'manipulation' }}
              />

              <div className="w-full">
                <ThreadEntryCard
                  key={`${entry.id}`}
                  entry={entry}
                  onRelationshipExpand={expandRelationships}
                  onNavigateToEntry={navigateToEntry}
                  onAddNewEntry={handleAddNewEntry}
                  onImageUpload={handleImageUpload}
                  onUrlUpload={handleUrlUpload}
                  expandedRelationships={expandedRelationships}
                  allEntryIds={new Set(flattenedEntries.map((e) => e.id))}
                  loadingRelationships={loadingRelationships}
                  maxDepth={maxDepth}
                  onOpenTreeModal={handleOpenTreeModal}
                  onCardClick={handleCardClick}
                  isCurrentEntry={index === currentEntryIndex}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 py-8">
          <button
            onClick={handleRollTheDice}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-medium text-white shadow-lg transition-all hover:bg-gray-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            type="button"
          >
            /random
          </button>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gray-700 px-6 py-3 font-medium text-white shadow-lg transition-all hover:bg-gray-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            type="button"
          >
            Search
          </button>
        </div>
      </div>

      {/* Tree Minimap */}
      <TreeMinimap
        key={flattenedEntries.length}
        entries={flattenedEntries}
        onNodeClick={handleTreeNodeClick}
      />

      {/* Search Modal */}
      <SearchModalBeta
        isOpen={isSearchModalOpen}
        closeModalFn={() => setIsSearchModalOpen(false)}
        inputQuery=""
      />

      {/* Tree Path Modal */}
      {isTreeModalOpen && treeModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="flex max-h-[95vh] w-full max-w-[95vw] flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Path to Root</h2>
              <button
                onClick={() => setIsTreeModalOpen(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
                type="button"
                aria-label="Close"
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
            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ minHeight: 0 }}
            >
              <TreePathDisplay
                currentEntry={treeModalEntry}
                allEntries={flattenedEntries}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
