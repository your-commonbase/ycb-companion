'use client';

import { useEffect, useRef, useState } from 'react';

import { fetchRandomEntry } from '@/helpers/functions';

interface CanvasItem {
  id: string;
  type: 'text' | 'image' | 'entry';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  imageUrl?: string;
  isEditing?: boolean;
  entryId?: string;
  metadata?: any;
}

interface ContextMenu {
  x: number;
  y: number;
  type: 'canvas' | 'item';
  itemId?: string;
}

const Canvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    itemId: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    itemId: null,
    offset: { x: 0, y: 0 },
  });
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    itemId: string | null;
    startSize: { width: number; height: number };
    startPos: { x: number; y: number };
  }>({
    isResizing: false,
    itemId: null,
    startSize: { width: 0, height: 0 },
    startPos: { x: 0, y: 0 },
  });

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [contextMenu]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchModalOpen]);

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setSelectedItem(null);
    setContextMenu(null);
  };

  // Handle keyboard events for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent delete if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'textarea'
      ) {
        return;
      }

      if (e.key === 'Delete' && selectedItem) {
        e.preventDefault();
        handleRemoveItem(selectedItem);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, handleRemoveItem]);

  // Handle canvas right-click
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    // Default to canvas context menu
    setSelectedItem(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
    });
  };

  // Handle item right-click
  const handleItemContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas context menu

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Position context menu at top-right of the item
    const itemScreenX = rect.left + item.x + canvasPan.x + item.width;
    const itemScreenY = rect.top + item.y + canvasPan.y;

    setSelectedItem(itemId);
    setContextMenu({
      x: itemScreenX,
      y: itemScreenY,
      type: 'item',
      itemId,
    });
  };

  // Handle canvas mouse down for panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click

    // If the target is not the canvas itself, don't start panning
    // This prevents panning when clicking on items
    if (e.target !== e.currentTarget) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Start canvas panning only when clicking on empty canvas space
    setIsPanningCanvas(true);
    setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });

    // Clear any selected items when clicking on empty space
    setSelectedItem(null);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Center in viewport if no context menu position
        const centerX = rect.width / 2 - canvasPan.x;
        const centerY = rect.height / 2 - canvasPan.y;
        const startX = contextMenu
          ? contextMenu.x - rect.left - canvasPan.x
          : centerX;
        const startY = contextMenu
          ? contextMenu.y - rect.top - canvasPan.y
          : centerY;

        const allNewItems: CanvasItem[] = [];
        const currentX = startX;
        let currentY = startY;

        // Process each search result and its related entries
        for (const [index, entry] of data.data.slice(0, 5).entries()) {
          const entryItems: CanvasItem[] = [];

          // Add the main entry
          const mainItem: CanvasItem = {
            id: `search-${Date.now()}-${index}`,
            type: entry.metadata?.type === 'image' ? 'image' : 'entry',
            x: currentX,
            y: currentY,
            width: 300,
            height: entry.metadata?.type === 'image' ? 200 : 150,
            content: entry.data,
            imageUrl: entry.metadata?.type === 'image' ? undefined : undefined,
            entryId: entry.id,
            metadata: entry.metadata,
          };
          entryItems.push(mainItem);

          // Fetch and add parent if exists
          if (entry.metadata?.parent_id) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const parentResponse = await fetch('/api/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: entry.metadata.parent_id }),
              });
              // eslint-disable-next-line no-await-in-loop
              const parentData = await parentResponse.json();

              if (parentData.data) {
                const parentItem: CanvasItem = {
                  id: `search-parent-${Date.now()}-${index}`,
                  type:
                    parentData.data.metadata?.type === 'image'
                      ? 'image'
                      : 'entry',
                  x: currentX - 320, // Position to the left
                  y: currentY,
                  width: 300,
                  height:
                    parentData.data.metadata?.type === 'image' ? 200 : 150,
                  content: parentData.data.data,
                  imageUrl:
                    parentData.data.metadata?.type === 'image'
                      ? undefined
                      : undefined,
                  entryId: parentData.data.id,
                  metadata: parentData.data.metadata,
                };
                entryItems.push(parentItem);
              }
            } catch (error) {
              console.error(
                'Failed to fetch parent for entry:',
                entry.id,
                error,
              );
            }
          }

          // Fetch and add comments if they exist
          if (
            entry.metadata?.alias_ids &&
            entry.metadata.alias_ids.length > 0
          ) {
            const commentIds = entry.metadata.alias_ids.slice(0, 3); // Limit to 3 comments
            for (const [commentIndex, commentId] of commentIds.entries()) {
              try {
                // eslint-disable-next-line no-await-in-loop
                const commentResponse = await fetch('/api/fetch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: commentId }),
                });
                // eslint-disable-next-line no-await-in-loop
                const commentData = await commentResponse.json();

                if (commentData.data) {
                  const commentItem: CanvasItem = {
                    id: `search-comment-${Date.now()}-${index}-${commentIndex}`,
                    type:
                      commentData.data.metadata?.type === 'image'
                        ? 'image'
                        : 'entry',
                    x: currentX + 320, // Position to the right
                    y: currentY + commentIndex * 160, // Stack comments vertically
                    width: 280,
                    height:
                      commentData.data.metadata?.type === 'image' ? 180 : 120,
                    content: commentData.data.data,
                    imageUrl:
                      commentData.data.metadata?.type === 'image'
                        ? undefined
                        : undefined,
                    entryId: commentData.data.id,
                    metadata: commentData.data.metadata,
                  };
                  entryItems.push(commentItem);
                }
              } catch (error) {
                console.error(
                  'Failed to fetch comment for entry:',
                  entry.id,
                  error,
                );
              }
            }
          }

          allNewItems.push(...entryItems);

          // Move to next row for the next search result
          currentY += 250;
        }

        // Fetch images for all image entries
        for (const item of allNewItems) {
          if (item.type === 'image' && item.entryId) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const imageResponse = await fetch('/api/fetchImageByIDs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [item.entryId] }),
              });

              // eslint-disable-next-line no-await-in-loop
              const imageData = await imageResponse.json();
              if (imageData.data?.body?.urls?.[item.entryId]) {
                item.imageUrl = imageData.data.body.urls[item.entryId];
              }
            } catch (error) {
              console.error(
                'Failed to fetch image for entry:',
                item.entryId,
                error,
              );
            }
          }
        }

        setItems((prev) => [...prev, ...allNewItems]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
    setSearchQuery('');
    setContextMenu(null);
    setIsSearchModalOpen(false);
  };

  // Add random entry
  const handleAddRandom = async () => {
    try {
      const randomEntry = await fetchRandomEntry();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Center in viewport if no context menu position
      const centerX = rect.width / 2 - canvasPan.x;
      const centerY = rect.height / 2 - canvasPan.y;
      const x = contextMenu ? contextMenu.x - rect.left - canvasPan.x : centerX;
      const y = contextMenu ? contextMenu.y - rect.top - canvasPan.y : centerY;

      const newItem: CanvasItem = {
        id: `random-${Date.now()}`,
        type: randomEntry.metadata?.type === 'image' ? 'image' : 'entry',
        x,
        y,
        width: 300,
        height: randomEntry.metadata?.type === 'image' ? 200 : 150,
        content: randomEntry.data,
        entryId: randomEntry.id,
        metadata: randomEntry.metadata,
      };

      // Fetch image if it's an image entry
      if (newItem.type === 'image' && newItem.entryId) {
        try {
          const imageResponse = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [newItem.entryId] }),
          });
          const imageData = await imageResponse.json();
          if (imageData.data?.body?.urls?.[newItem.entryId]) {
            newItem.imageUrl = imageData.data.body.urls[newItem.entryId];
          }
        } catch (error) {
          console.error(
            'Failed to fetch image for random entry:',
            newItem.entryId,
            error,
          );
        }
      }

      setItems((prev) => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to fetch random entry:', error);
    }
    setContextMenu(null);
  };

  // Add new text box
  const handleAddText = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Center in viewport if no context menu position
    const centerX = rect.width / 2 - canvasPan.x;
    const centerY = rect.height / 2 - canvasPan.y;
    const x = contextMenu ? contextMenu.x - rect.left - canvasPan.x : centerX;
    const y = contextMenu ? contextMenu.y - rect.top - canvasPan.y : centerY;

    const newItem: CanvasItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      x,
      y,
      width: 200,
      height: 100,
      content: 'New text box',
      isEditing: true,
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedItem(newItem.id);
    setContextMenu(null);
  };

  // Add item to YCB
  const handleAddToYCB = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: item.content,
          metadata: {
            source: 'canvas',
            originalType: item.type,
            title: 'Canvas Item',
          },
        }),
      });

      if (response.ok) {
        // Optional: Show success message or update UI
        console.log('Item added to YCB successfully');
      }
    } catch (error) {
      console.error('Failed to add item to YCB:', error);
    }
    setContextMenu(null);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent canvas panning when clicking on items
    if (e.button !== 0) return; // Only handle left click

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Account for canvas pan when calculating offset
    const offsetX = e.clientX - rect.left - canvasPan.x - item.x;
    const offsetY = e.clientY - rect.top - canvasPan.y - item.y;

    setDragState({
      isDragging: true,
      itemId,
      offset: { x: offsetX, y: offsetY },
    });
    setSelectedItem(itemId);

    // Focus canvas to enable keyboard events
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  };

  // Handle resize mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation(); // Prevent item dragging
    if (e.button !== 0) return; // Only handle left click

    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    setResizeState({
      isResizing: true,
      itemId,
      startSize: { width: item.width, height: item.height },
      startPos: { x: e.clientX, y: e.clientY },
    });
  };

  // Handle mouse move for dragging, panning, and resizing
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Handle canvas panning
    if (isPanningCanvas) {
      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;
      setCanvasPan({ x: newPanX, y: newPanY });
      return;
    }

    // Handle item resizing
    if (resizeState.isResizing && resizeState.itemId) {
      const deltaX = e.clientX - resizeState.startPos.x;
      const deltaY = e.clientY - resizeState.startPos.y;

      const newWidth = Math.max(100, resizeState.startSize.width + deltaX); // Minimum width of 100px
      const newHeight = Math.max(80, resizeState.startSize.height + deltaY); // Minimum height of 80px

      setItems((prev) =>
        prev.map((item) =>
          item.id === resizeState.itemId
            ? { ...item, width: newWidth, height: newHeight }
            : item,
        ),
      );
      return;
    }

    // Handle item dragging
    if (dragState.isDragging && dragState.itemId) {
      const newX = e.clientX - rect.left - canvasPan.x - dragState.offset.x;
      const newY = e.clientY - rect.top - canvasPan.y - dragState.offset.y;

      setItems((prev) =>
        prev.map((item) =>
          item.id === dragState.itemId ? { ...item, x: newX, y: newY } : item,
        ),
      );
    }
  };

  // Handle mouse up to stop dragging, panning, and resizing
  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      itemId: null,
      offset: { x: 0, y: 0 },
    });
    setIsPanningCanvas(false);
    setResizeState({
      isResizing: false,
      itemId: null,
      startSize: { width: 0, height: 0 },
      startPos: { x: 0, y: 0 },
    });
  };

  // Handle text editing
  const handleTextEdit = (itemId: string, newContent: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, content: newContent } : item,
      ),
    );
  };

  // Handle text editing state
  const handleTextEditingState = (itemId: string, isEditing: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isEditing } : item)),
    );
  };

  // Save canvas to file
  const handleSave = () => {
    const canvasData = {
      items,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(canvasData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Refresh image URLs for loaded items
  const refreshImageUrls = async (loadedItems: CanvasItem[]) => {
    const imageItems = loadedItems.filter(
      (item) => item.type === 'image' && item.entryId,
    );

    for (const item of imageItems) {
      if (item.entryId) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const imageResponse = await fetch('/api/fetchImageByIDs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [item.entryId] }),
          });
          // eslint-disable-next-line no-await-in-loop
          const imageData = await imageResponse.json();
          if (imageData.data?.body?.urls?.[item.entryId]) {
            item.imageUrl = imageData.data.body.urls[item.entryId];
          }
        } catch (error) {
          console.error(
            'Failed to refresh image URL for entry:',
            item.entryId,
            error,
          );
        }
      }
    }

    return loadedItems;
  };

  // Load canvas from file
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const canvasData = JSON.parse(event.target?.result as string);
          if (canvasData.items && Array.isArray(canvasData.items)) {
            // Refresh image URLs for any image entries
            const refreshedItems = await refreshImageUrls(canvasData.items);
            setItems(refreshedItems);
            setSelectedItem(null);
          }
        } catch (error) {
          console.error('Failed to load canvas file:', error);
          alert('Failed to load canvas file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="relative h-screen w-full bg-gray-100">
      {/* Toolbar */}
      <div className="absolute left-4 top-4 z-20 flex gap-2">
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="button"
        >
          Save
        </button>
        <button
          onClick={handleLoad}
          className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          type="button"
        >
          Load
        </button>
        <div className="p-2 text-sm text-gray-600">Items: {items.length}</div>
      </div>

      {/* Canvas */}
      {/* eslint-disable-next-line */}
      <div
        ref={canvasRef}
        className={`size-full select-none ${isPanningCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onContextMenu={handleCanvasContextMenu}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="application"
        aria-label="Interactive canvas for organizing content"
        onKeyDown={(e) => {
          if (e.key === 'Delete' && selectedItem) {
            e.preventDefault();
            handleRemoveItem(selectedItem);
          }
        }}
      >
        {/* Canvas Items Container with Pan Transform */}
        <div
          style={{
            transform: `translate(${canvasPan.x}px, ${canvasPan.y}px)`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`absolute cursor-move border-2 bg-white shadow-lg ${
                selectedItem === item.id
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300'
              } ${item.type === 'image' ? 'relative' : ''}`}
              style={{
                left: item.x,
                top: item.y,
                width: item.width,
                height: item.height,
              }}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              onContextMenu={(e) => handleItemContextMenu(e, item.id)}
              role="button"
              aria-label={`Canvas item: ${item.content.slice(0, 50)}${item.content.length > 50 ? '...' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedItem(item.id);
                  // Focus canvas to enable keyboard events
                  if (canvasRef.current) {
                    canvasRef.current.focus();
                  }
                }
              }}
            >
              {(() => {
                if (item.type === 'image' && item.imageUrl) {
                  return (
                    <img
                      src={item.imageUrl}
                      alt="Canvas item"
                      className="size-full object-cover"
                      draggable={false}
                    />
                  );
                }

                if (item.type === 'text' && item.isEditing) {
                  return (
                    <textarea
                      className="size-full resize-none border-none p-2 text-sm focus:outline-none"
                      value={item.content}
                      onChange={(e) => handleTextEdit(item.id, e.target.value)}
                      onBlur={() => handleTextEditingState(item.id, false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleTextEditingState(item.id, false);
                        }
                      }}
                    />
                  );
                }

                return (
                  <div
                    className="size-full overflow-auto p-2 text-sm"
                    onDoubleClick={() => {
                      if (item.type === 'text') {
                        handleTextEditingState(item.id, true);
                      }
                    }}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {item.content}
                    </div>
                  </div>
                );
              })()}

              {/* Resize Handle */}
              {/* eslint-disable-next-line */}
              <div
                className="absolute bottom-0 right-0 size-4 cursor-nw-resize bg-blue-500 opacity-0 transition-opacity hover:opacity-100"
                style={{
                  opacity: selectedItem === item.id ? 1 : 0,
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, item.id)}
                title="Drag to resize"
              >
                <svg
                  className="size-full text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22,22H20V20H22V22M22,18H20V16H22V18M18,22H16V20H18V22M18,18H16V16H18V18M14,22H12V20H14V22M22,14H20V12H22V14Z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'canvas' ? (
            <>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                type="button"
              >
                🔍 Search & Add
              </button>
              <button
                onClick={handleAddRandom}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                type="button"
              >
                🎲 Add Random Entry
              </button>
              <button
                onClick={handleAddText}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                type="button"
              >
                📝 Add Text Box
              </button>
            </>
          ) : (
            <>
              {contextMenu.itemId &&
                items.find((i) => i.id === contextMenu.itemId)?.entryId && (
                  <button
                    onClick={() => {
                      const item = items.find(
                        (i) => i.id === contextMenu.itemId,
                      );
                      if (item?.entryId) {
                        window.open(
                          `/dashboard/entry/${item.entryId}`,
                          '_blank',
                        );
                      }
                      setContextMenu(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    type="button"
                  >
                    🔗 Go to Entry
                  </button>
                )}
              <button
                onClick={() =>
                  contextMenu.itemId && handleAddToYCB(contextMenu.itemId)
                }
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                type="button"
              >
                ➕ Add to YCB
              </button>
              <button
                onClick={() =>
                  contextMenu.itemId && handleRemoveItem(contextMenu.itemId)
                }
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                type="button"
              >
                🗑️ Remove
              </button>
            </>
          )}
        </div>
      )}

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">
              Search and Add to Canvas
            </h3>
            <div className="space-y-4">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  } else if (e.key === 'Escape') {
                    setIsSearchModalOpen(false);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  type="button"
                >
                  Search & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
