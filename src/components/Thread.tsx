'use client';

import { useChat } from 'ai/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import ImageUpload from '@/components/ImageUpload';
import PendingQueue from '@/components/PendingQueue';
import { fetchRandomEntry } from '@/helpers/functions';
import {
  enqueueAddText,
  enqueueAddURL,
  useAddQueueProcessor,
} from '@/hooks/useAddQueue';
import { useAutoScrollMode } from '@/hooks/useAutoScrollMode';

import SearchModalBeta from './SearchModalBeta';
import QuickLook from './Thread/QuickLook';
import ThreadEntryCard from './Thread/ThreadEntryCard';
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
  const [triggerAddComment, setTriggerAddComment] = useState(false);
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false);
  const [isAddURLModalOpen, setIsAddURLModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [currentModalEntry, setCurrentModalEntry] =
    useState<FlattenedEntry | null>(null);
  const [commentText, setCommentText] = useState('');
  const [urlText, setUrlText] = useState('');
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  const idSet = useRef(new Set<string>());
  const router = useRouter();
  const { autoScrollMode, maxDepth } = useAutoScrollMode();
  const processedEntries = useRef(new Set<string>());
  useAddQueueProcessor();

  // AI Chat hook for auto comment generation
  const {
    messages,
    append,
    isLoading: isChatLoading,
  } = useChat({
    onFinish: (message) => {
      // When AI finishes generating, update the comment text
      setCommentText(message.content);
      setIsGeneratingComment(false);
    },
  });

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

      // Don't intercept if any modifier keys are pressed (Cmd, Ctrl, Alt, Shift)
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
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
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        // Trigger comment mode for current entry
        setTriggerAddComment(true);
        // Reset trigger after a brief moment
        setTimeout(() => setTriggerAddComment(false), 100);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        // Navigate to current entry
        const currentEntry = flattenedEntries[currentEntryIndex];
        if (currentEntry) {
          router.push(`/dashboard/entry/${currentEntry.id}`);
        }
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        // Open QuickLook for current entry
        const currentEntry = flattenedEntries[currentEntryIndex];
        if (currentEntry) {
          setTreeModalEntry(currentEntry);
          setIsTreeModalOpen(true);
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

  const handleOpenAddCommentModal = (entry: FlattenedEntry) => {
    setCurrentModalEntry(entry);
    setIsAddCommentModalOpen(true);
  };

  const handleOpenAddURLModal = (entry: FlattenedEntry) => {
    setCurrentModalEntry(entry);
    setIsAddURLModalOpen(true);
  };

  const handleOpenAddImageModal = (entry: FlattenedEntry) => {
    setCurrentModalEntry(entry);
    setIsAddImageModalOpen(true);
  };

  const handleAutoComment = async () => {
    if (!currentModalEntry) return;

    setIsGeneratingComment(true);
    const data = currentModalEntry.data || '';
    const title = currentModalEntry.metadata?.title || 'Untitled';
    const author = currentModalEntry.metadata?.author || 'Unknown';

    try {
      // Build complete thread context using the same logic as QuickLook
      let threadContext = '';

      // Step 1: Build complete ID tree structure using DFS
      const allThreadIds = new Set<string>();
      const parentChildMap = new Map<string, Set<string>>();
      const childParentMap = new Map<string, string>();
      const processedIds = new Set<string>();

      // Helper to fetch entry metadata only
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

      // DFS to build complete ID tree
      const buildIdTree = async (entryId: string): Promise<void> => {
        if (processedIds.has(entryId)) return;
        processedIds.add(entryId);
        allThreadIds.add(entryId);

        // Use current entry data if it's the starting entry
        let metadata;
        if (entryId === currentModalEntry.id) {
          metadata = {
            parent_id: currentModalEntry.metadata?.parent_id,
            alias_ids: currentModalEntry.metadata?.alias_ids || [],
          };
        } else {
          metadata = await fetchEntryMetadata(entryId);
          if (!metadata) return;
        }

        // Process parent relationship
        if (metadata.parent_id && metadata.parent_id.trim()) {
          const parentId = metadata.parent_id.trim();
          childParentMap.set(entryId, parentId);

          if (!parentChildMap.has(parentId)) {
            parentChildMap.set(parentId, new Set());
          }
          parentChildMap.get(parentId)!.add(entryId);

          // Recurse to parent
          await buildIdTree(parentId);
        }

        // Process children relationships
        if (metadata.alias_ids && Array.isArray(metadata.alias_ids)) {
          const childIds = metadata.alias_ids
            .filter((id: any) => typeof id === 'string' && id.trim() !== '')
            .map((id: string) => id.trim());

          if (!parentChildMap.has(entryId)) {
            parentChildMap.set(entryId, new Set());
          }

          for (const childId of childIds) {
            parentChildMap.get(entryId)!.add(childId);
            childParentMap.set(childId, entryId);

            // Recurse to child
            // eslint-disable-next-line no-await-in-loop
            await buildIdTree(childId);
          }
        }
      };

      // Only build thread if entry has relationships
      if (
        currentModalEntry.metadata?.parent_id ||
        (currentModalEntry.metadata?.alias_ids &&
          currentModalEntry.metadata.alias_ids.length > 0)
      ) {
        await buildIdTree(currentModalEntry.id);

        if (allThreadIds.size > 1) {
          // Fetch all thread entries in parallel
          const threadEntries = new Map<string, any>();

          const fetchPromises = Array.from(allThreadIds)
            .filter((id) => id !== currentModalEntry.id)
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

                threadEntries.set(id, responseData.data);
                return responseData.data;
              } catch (error) {
                console.error(`Error fetching entry ${id}:`, error);
                return null;
              }
            });

          await Promise.all(fetchPromises);

          // Build thread context string
          const threadTexts = Array.from(threadEntries.values()).map(
            (entry) => {
              const entryTitle = entry.metadata?.title || 'Untitled';
              const entryAuthor = entry.metadata?.author || 'Unknown';
              return `${entry.data} (${entryTitle}, ${entryAuthor})`;
            },
          );

          if (threadTexts.length > 0) {
            threadContext = threadTexts.join('\n\n');
          }
        }
      }

      // Fetch neighbors context
      let neighborsContext = '';
      try {
        const neighborsResponse = await fetch('/api/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ platformId: currentModalEntry.id }),
        });
        const neighborsData = await neighborsResponse.json();
        if (neighborsData.data && neighborsData.data.length > 0) {
          const neighborTexts = neighborsData.data
            .slice(0, 5)
            .map((neighbor: any) => {
              const neighborTitle = neighbor.metadata?.title || 'Untitled';
              const neighborAuthor = neighbor.metadata?.author || 'Unknown';
              return `${neighbor.data} (${neighborTitle}, ${neighborAuthor})`;
            });
          neighborsContext = neighborTexts.join('\n\n');
        }
      } catch (error) {
        console.error('Error fetching neighbors:', error);
      }

      // Build the enhanced prompt with context
      let prompt = `provide world context using specific details and references for entry. do not just rehash what you see in front of you. provide helpful external world events and information to add smart context and commentary aka marginalia. do not return a list: ${data} ${title} ${author}`;

      if (threadContext) {
        prompt += `\n\n{thread: ${threadContext}}`;
      }

      if (neighborsContext) {
        prompt += `\n\n{neighbors: ${neighborsContext}}`;
      }

      await append({
        role: 'user',
        content: prompt,
      });
    } catch (error) {
      console.error('Error generating auto comment:', error);
      setIsGeneratingComment(false);
    }
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() || !currentModalEntry) return;

    enqueueAddText(
      {
        data: commentText.trim(),
        metadata: {
          parent_id: currentModalEntry.id,
          title: currentModalEntry.metadata.title,
          author: currentModalEntry.metadata.author,
        },
        parentId: currentModalEntry.id,
      },
      (addedCommentData) => {
        const newEntry: FlattenedEntry = {
          id: addedCommentData.id,
          data: commentText.trim(),
          comments: [],
          createdAt: addedCommentData.createdAt,
          metadata: {
            ...addedCommentData.metadata,
            parent_id: currentModalEntry.id,
          },
          relationshipType: 'comment',
          relationshipSource: currentModalEntry.id,
          level: currentModalEntry.level + 1,
          hasMoreRelations: true,
        };
        handleAddNewEntry(newEntry, currentModalEntry.id);
      },
    );

    setCommentText('');
    setIsAddCommentModalOpen(false);
    setCurrentModalEntry(null);
  };

  const handleSubmitURL = () => {
    if (!urlText.trim() || !currentModalEntry) return;

    enqueueAddURL(
      {
        url: urlText.trim(),
        metadata: {
          parent_id: currentModalEntry.id,
        },
      },
      (addedCommentData) => {
        handleUrlUpload(addedCommentData, currentModalEntry.id);
      },
    );

    setUrlText('');
    setIsAddURLModalOpen(false);
    setCurrentModalEntry(null);
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
      className="min-h-screen"
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
              className={`relative flex items-start justify-center ${
                isMobile ? 'h-screen px-12 py-4' : 'min-h-screen px-6 py-8'
              }`}
              style={{
                scrollSnapAlign: isMobile ? 'start' : 'none',
                maxHeight: '100vh',
                overflowY: 'visible',
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
                  triggerAddComment={triggerAddComment}
                  onOpenAddCommentModal={handleOpenAddCommentModal}
                  onOpenAddURLModal={handleOpenAddURLModal}
                  onOpenAddImageModal={handleOpenAddImageModal}
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

      {/* QuickLook Modal */}
      {isTreeModalOpen && treeModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="flex max-h-[95vh] w-full max-w-[95vw] flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">QuickLook</h2>
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
              <QuickLook
                currentEntry={treeModalEntry}
                allEntries={flattenedEntries}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {isAddCommentModalOpen && currentModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex h-[95vh] w-[95vw] max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Add Comment</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoComment}
                  disabled={isGeneratingComment || isChatLoading}
                  className="flex items-center gap-2 rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300"
                  type="button"
                >
                  {isGeneratingComment || isChatLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-b-2 border-white" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Auto Comment
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddCommentModalOpen(false);
                    setCurrentModalEntry(null);
                    setCommentText('');
                  }}
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
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="relative size-full">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={10}
                  style={{ fontSize: '17px' }}
                  className="size-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Add a comment..."
                  disabled={isGeneratingComment || isChatLoading}
                />
                {(isGeneratingComment || isChatLoading) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white bg-opacity-75">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-8 animate-spin rounded-full border-b-2 border-purple-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Generating AI comment...
                      </span>
                      {messages.length > 0 &&
                        messages[messages.length - 1]?.role === 'assistant' &&
                        messages[messages.length - 1]?.content && (
                          <div className="max-h-40 max-w-2xl overflow-y-auto rounded-lg border bg-gray-50 p-4 text-left text-sm text-gray-700">
                            <div className="whitespace-pre-wrap">
                              {messages[messages.length - 1]?.content}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  setCommentText('');
                  setIsAddCommentModalOpen(false);
                  setCurrentModalEntry(null);
                  setIsGeneratingComment(false);
                }}
                type="button"
                className="rounded-lg bg-gray-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitComment}
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add URL Modal */}
      {isAddURLModalOpen && currentModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex h-[95vh] w-[95vw] max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Add URL</h2>
              <button
                onClick={() => {
                  setIsAddURLModalOpen(false);
                  setCurrentModalEntry(null);
                }}
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
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  {/* eslint-disable-next-line */}
                  <label
                    htmlFor="url-input"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    URL
                  </label>
                  <input
                    id="url-input"
                    type="text"
                    value={urlText}
                    onChange={(e) => setUrlText(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-lg text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Enter a URL to be processed and added as a comment to this
                  entry.
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 p-6">
              <button
                onClick={() => {
                  setUrlText('');
                  setIsAddURLModalOpen(false);
                  setCurrentModalEntry(null);
                }}
                type="button"
                className="rounded-lg bg-gray-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitURL}
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Image Modal */}
      {isAddImageModalOpen && currentModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex h-[95vh] w-[95vw] max-w-4xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Add Image</h2>
              <button
                onClick={() => {
                  setIsAddImageModalOpen(false);
                  setCurrentModalEntry(null);
                }}
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
            <div className="flex-1 overflow-y-auto p-6">
              <ImageUpload
                metadata={{ parent_id: currentModalEntry.id }}
                onUploadComplete={(result) => {
                  handleImageUpload(result, currentModalEntry.id);
                  setIsAddImageModalOpen(false);
                  setCurrentModalEntry(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
