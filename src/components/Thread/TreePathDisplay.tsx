'use client';

import { useEffect, useState } from 'react';

import type { FlattenedEntry, TreePathDisplayProps } from './types';

const TreePathDisplay: React.FC<TreePathDisplayProps> = ({
  currentEntry,
  allEntries,
}) => {
  const [pathEntries, setPathEntries] = useState<FlattenedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildPath = () => {
      setLoading(true);
      const path: FlattenedEntry[] = [];

      // Build the complete path from current entry back to root
      // using the existing flattenedEntries which already contain all relationships
      const buildPathRecursive = (
        entry: FlattenedEntry,
        visited = new Set<string>(),
      ): void => {
        // Prevent infinite loops
        if (visited.has(entry.id)) {
          return;
        }
        visited.add(entry.id);

        // Add current entry to the front of the path
        path.unshift(entry);

        // If this is the root, we're done
        if (entry.relationshipType === 'root') {
          return;
        }

        // Find the parent entry in allEntries
        if (entry.relationshipSource) {
          const parentEntry = allEntries.find(
            (e) => e.id === entry.relationshipSource,
          );
          if (parentEntry) {
            buildPathRecursive(parentEntry, visited);
          } else {
            // If parent not found in current entries, it might be the original root
            // Try to find any root entry
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
      setPathEntries(path);
      setLoading(false);
    };

    buildPath();
  }, [currentEntry, allEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    );
  }

  const getRelationshipInfo = (entry: FlattenedEntry, index: number) => {
    if (index === 0)
      return {
        label: 'Root',
        color: 'bg-green-500',
        description: 'Original thread entry',
      };
    if (index === pathEntries.length - 1)
      return {
        label: 'Current',
        color: 'bg-blue-500',
        description: 'Selected entry',
      };

    switch (entry.relationshipType) {
      case 'parent':
        return {
          label: 'Parent',
          color: 'bg-purple-500',
          description: 'Parent entry',
        };
      case 'comment':
        // eslint-disable-next-line
        const hasScore = entry.similarity !== undefined;
        return {
          label: hasScore ? 'Similar' : 'Comment',
          color: hasScore ? 'bg-orange-500' : 'bg-orange-400',
          description: hasScore
            ? `Similarity: ${(entry.similarity! * 100).toFixed(1)}%`
            : 'Comment entry',
        };
      case 'neighbor':
        // eslint-disable-next-line
        const neighborScore = entry.similarity !== undefined;
        return {
          label: neighborScore ? 'Related' : 'Neighbor',
          color: neighborScore ? 'bg-green-600' : 'bg-green-400',
          description: neighborScore
            ? `Similarity: ${(entry.similarity! * 100).toFixed(1)}%`
            : 'Neighbor entry',
        };
      default:
        return {
          label: 'Entry',
          color: 'bg-gray-400',
          description: 'Thread entry',
        };
    }
  };

  return (
    <div className="space-y-4">
      {pathEntries.map((entry, index) => {
        const relationshipInfo = getRelationshipInfo(entry, index);
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
              <span className="text-sm font-medium text-gray-600">
                Level {entry.level}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs text-white ${relationshipInfo.color}`}
              >
                {relationshipInfo.label}
              </span>
              <div className="text-xs text-gray-500">
                ID: {entry.id.slice(0, 8)}...
              </div>
            </div>

            {relationshipInfo.description !== `Level ${entry.level}` && (
              <div className="mb-2 text-xs text-gray-600">
                {relationshipInfo.description}
              </div>
            )}

            <div className="mb-3">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                {entry.data}
              </div>
            </div>

            {index < pathEntries.length - 1 && (
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

export default TreePathDisplay;
