'use client';

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useEffect, useState } from 'react';

interface KanbanEntry {
  id: string;
  data: string;
  metadata: {
    kanban_state: string;
    [key: string]: any;
  };
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  entries: KanbanEntry[];
}

export default function KanbanPage() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'clarify', title: 'Clarify', entries: [] },
    { id: 'ready', title: 'Ready', entries: [] },
    { id: 'waiting', title: 'Waiting', entries: [] },
    { id: 'backburner', title: 'Backburner', entries: [] },
    { id: 'archive', title: 'Archive', entries: [] },
  ]);
  const [newEntryTexts, setNewEntryTexts] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingEntries, setIsAddingEntries] = useState<
    Record<string, boolean>
  >({});

  const fetchKanbanEntries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use the dedicated fetchKanban endpoint
      const response = await fetch('/api/fetchKanban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 1,
          limit: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const entries: KanbanEntry[] = data.records || [];

      console.log('Fetched kanban entries:', entries.length);
      console.log('Raw API response:', data);

      // Parse metadata for each entry and group by kanban state
      const processedEntries = entries.map((entry) => ({
        ...entry,
        metadata:
          typeof entry.metadata === 'string'
            ? JSON.parse(entry.metadata)
            : entry.metadata,
      }));

      const updatedColumns = columns.map((column) => ({
        ...column,
        entries: processedEntries.filter((entry) => {
          try {
            return entry.metadata.kanban_state === column.id;
          } catch {
            return false;
          }
        }),
      }));

      setColumns(updatedColumns);
    } catch (fetchError) {
      console.error('Error fetching kanban entries:', fetchError);
      setError('Failed to load kanban entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch existing kanban entries on component mount
  useEffect(() => {
    fetchKanbanEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEntry = async (columnId: string) => {
    const text = newEntryTexts[columnId]?.trim();
    if (!text) return;

    setIsAddingEntries((prev) => ({ ...prev, [columnId]: true }));

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: text,
          metadata: {
            kanban_state: columnId,
            title: text.slice(0, 50),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add entry');
      }

      const result = await response.json();
      const newEntry: KanbanEntry = {
        id: result.respData.id,
        data: result.respData.data,
        metadata: result.respData.metadata,
        createdAt: result.respData.createdAt,
      };

      console.log('Added new entry with full metadata:', newEntry);

      // Update local state
      setColumns((prev) =>
        prev.map((column) =>
          column.id === columnId
            ? { ...column, entries: [...column.entries, newEntry] }
            : column,
        ),
      );

      // Clear input
      setNewEntryTexts((prev) => ({ ...prev, [columnId]: '' }));
    } catch (setNewError) {
      console.error('Error adding entry:', setNewError);
      alert('Failed to add entry. Please try again.');
    } finally {
      setIsAddingEntries((prev) => ({ ...prev, [columnId]: false }));
    }
  };

  const deleteAllArchived = async () => {
    const archiveColumn = columns.find((col) => col.id === 'archive');
    if (!archiveColumn?.entries.length) {
      alert('No archived entries to delete.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all ${archiveColumn.entries.length} archived entries? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      // Delete all archived entries from the backend
      const deletePromises = archiveColumn.entries.map((entry) =>
        fetch('/api/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: entry.id }),
        }),
      );

      await Promise.all(deletePromises);

      // Update local state
      setColumns((prev) =>
        prev.map((column) =>
          column.id === 'archive' ? { ...column, entries: [] } : column,
        ),
      );

      alert('All archived entries have been deleted.');
    } catch (deleteError) {
      console.error('Error deleting archived entries:', deleteError);
      alert('Failed to delete some entries. Please try again.');
    }
  };

  const updateEntryState = async (entryId: string, newState: string) => {
    try {
      // Find the entry to update
      let entryToUpdate: KanbanEntry | null = null;
      for (const column of columns) {
        const found = column.entries.find((entry) => entry.id === entryId);
        if (found) {
          entryToUpdate = found;
          break;
        }
      }

      if (!entryToUpdate) return;

      // Ensure metadata is properly handled (parse if string, keep if object)
      const currentMetadata =
        typeof entryToUpdate.metadata === 'string'
          ? JSON.parse(entryToUpdate.metadata)
          : entryToUpdate.metadata;

      const updatedMetadata = {
        ...currentMetadata,
        kanban_state: newState,
      };

      console.log('Updating entry:', entryId);
      console.log('Original metadata:', currentMetadata);
      console.log('Updated metadata:', updatedMetadata);

      // Update the entry in the backend
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entryId,
          data: entryToUpdate.data,
          metadata: updatedMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update entry');
      }
    } catch (updateError) {
      console.error('Error updating entry state:', updateError);
      // Revert the local state change by refetching
      fetchKanbanEntries();
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Update local state optimistically
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find(
      (col) => col.id === destination.droppableId,
    );

    if (!sourceColumn || !destColumn) return;

    const draggedEntry = sourceColumn.entries[source.index];

    if (!draggedEntry) return;

    // Remove from source
    const newSourceEntries = [...sourceColumn.entries];
    newSourceEntries.splice(source.index, 1);

    // Add to destination
    const newDestEntries = [...destColumn.entries];

    // Ensure metadata is properly preserved
    const currentMetadata =
      typeof draggedEntry.metadata === 'string'
        ? JSON.parse(draggedEntry.metadata)
        : draggedEntry.metadata;

    newDestEntries.splice(destination.index, 0, {
      ...draggedEntry,
      metadata: {
        ...currentMetadata,
        kanban_state: destination.droppableId,
      },
    });

    // Update columns
    setColumns((prev) =>
      prev.map((column) => {
        if (column.id === source.droppableId) {
          return { ...column, entries: newSourceEntries };
        }
        if (column.id === destination.droppableId) {
          return { ...column, entries: newDestEntries };
        }
        return column;
      }),
    );

    // Update backend
    updateEntryState(draggableId, destination.droppableId);
  };

  const openEntry = (entryId: string) => {
    window.open(`/dashboard/entry/${entryId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto size-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="mb-4 text-gray-900">{error}</p>
          <button
            type="button"
            onClick={fetchKanbanEntries}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600">Organize your thoughts and tasks</p>
        </div>
        <button
          type="button"
          onClick={fetchKanbanEntries}
          disabled={isLoading}
          className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-6 overflow-x-auto pb-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex min-w-[300px] flex-col rounded-lg bg-white shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div>
                  <h2 className="text-lg font-semibold capitalize text-gray-900">
                    {column.title}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {column.entries.length} items
                  </span>
                </div>
                {column.id === 'archive' && column.entries.length > 0 && (
                  <button
                    type="button"
                    onClick={deleteAllArchived}
                    className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete All
                  </button>
                )}
              </div>

              {/* Add Entry Form */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEntryTexts[column.id] || ''}
                    onChange={(e) =>
                      setNewEntryTexts((prev) => ({
                        ...prev,
                        [column.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addEntry(column.id);
                      }
                    }}
                    placeholder="Add new entry..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => addEntry(column.id)}
                    disabled={
                      isAddingEntries[column.id] ||
                      !newEntryTexts[column.id]?.trim()
                    }
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400"
                  >
                    {isAddingEntries[column.id] ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(droppableProvided, droppableSnapshot) => (
                  <div
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    className={`flex-1 space-y-3 p-4 ${
                      droppableSnapshot.isDraggingOver ? 'bg-gray-50' : ''
                    }`}
                    style={{ minHeight: '200px' }}
                  >
                    {column.entries.map((entry, index) => (
                      <Draggable
                        key={entry.id}
                        draggableId={entry.id}
                        index={index}
                      >
                        {(draggableProvided, draggableSnapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            onClick={() => openEntry(entry.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openEntry(entry.id);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md ${
                              draggableSnapshot.isDragging
                                ? 'rotate-2 shadow-lg'
                                : ''
                            }`}
                          >
                            <p
                              className="text-sm text-gray-900"
                              style={{
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {entry.data}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-gray-400">
                                Click to open
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
