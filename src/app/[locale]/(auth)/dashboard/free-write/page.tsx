'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { enqueueAddText } from '@/hooks/useAddQueue';

interface Highlight {
  id: string;
  start: number;
  end: number;
  text: string;
}

type Mode = 'write' | 'highlight';

export default function FreeWritePage() {
  const [mode, setMode] = useState<Mode>('write');
  const [content, setContent] = useState('');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text selection for highlighting
  const handleTextSelection = () => {
    if (mode !== 'highlight' || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end || start < 0 || end < 0) return; // No selection

    const selectedText = content.slice(start, end);
    if (!selectedText.trim()) return; // Empty selection

    // Check if selection overlaps with existing highlights
    const overlaps = highlights.some(
      (highlight) =>
        (start >= highlight.start && start < highlight.end) ||
        (end > highlight.start && end <= highlight.end) ||
        (start <= highlight.start && end >= highlight.end),
    );

    if (overlaps) {
      // eslint-disable-next-line no-alert
      alert('Cannot highlight overlapping text');
      return;
    }

    // Create new highlight
    const newHighlight: Highlight = {
      id: `highlight-${Date.now()}`,
      start,
      end,
      text: selectedText,
    };

    setHighlights((prev) =>
      [...prev, newHighlight].sort((a, b) => a.start - b.start),
    );

    // Clear selection
    textarea.setSelectionRange(start, start);
  };

  // Handle highlight deletion
  const deleteHighlight = (highlightId: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
  };

  // Render content with highlights for display
  const renderHighlightedText = () => {
    if (highlights.length === 0) {
      return (
        <span className="whitespace-pre-wrap font-mono text-sm">{content}</span>
      );
    }

    const parts = [];
    let lastIndex = 0;

    highlights.forEach((highlight) => {
      // Add text before highlight
      if (highlight.start > lastIndex) {
        parts.push(
          <span
            key={`text-before-${highlight.id}`}
            className="font-mono text-sm"
          >
            {content.slice(lastIndex, highlight.start)}
          </span>,
        );
      }

      // Add highlighted text
      parts.push(
        <button
          key={highlight.id}
          className="group relative inline-block cursor-pointer rounded border-none bg-yellow-200 px-1 font-mono text-sm"
          onClick={() => deleteHighlight(highlight.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              deleteHighlight(highlight.id);
            }
          }}
          title="Click to delete highlight"
          type="button"
        >
          {content.slice(highlight.start, highlight.end)}
          <button
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              deleteHighlight(highlight.id);
            }}
            aria-label="Delete highlight"
            type="button"
          >
            ×
          </button>
        </button>,
      );

      lastIndex = highlight.end;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end" className="font-mono text-sm">
          {content.slice(lastIndex)}
        </span>,
      );
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
  };

  // Handle save
  const handleSave = async () => {
    if (!content.trim()) {
      // eslint-disable-next-line no-alert
      alert('Please write some content before saving');
      return;
    }

    setIsSaving(true);

    try {
      // Save main entry
      await new Promise<void>((resolve, reject) => {
        enqueueAddText(
          {
            data: content,
            metadata: {
              title: 'Free Write Entry',
              author: 'Free Write Mode',
              type: 'free-write',
            },
          },
          (addedEntryData) => {
            // Save highlights as comments
            const highlightPromises = highlights.map(
              (highlight) =>
                new Promise<void>((highlightResolve) => {
                  enqueueAddText(
                    {
                      data: highlight.text,
                      metadata: {
                        parent_id: addedEntryData.id,
                        title: 'Highlight',
                        author: 'Highlight Mode',
                        type: 'highlight',
                        highlight_start: highlight.start,
                        highlight_end: highlight.end,
                      },
                      parentId: addedEntryData.id,
                    },
                    () => {
                      highlightResolve();
                    },
                  );
                }),
            );

            Promise.all(highlightPromises)
              .then(() => resolve())
              .catch((error) => reject(error));
          },
        );
      });

      // Clear content and highlights after successful save
      setContent('');
      setHighlights([]);
      setMode('write');

      // eslint-disable-next-line no-alert
      alert('Entry saved successfully!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving entry:', error);
      // eslint-disable-next-line no-alert
      alert('Error saving entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Free Write and Highlight
          </h1>

          {/* Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-white p-1 shadow-sm">
              <button
                onClick={() => setMode('write')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'write'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                type="button"
              >
                Free Write
              </button>
              <button
                onClick={() => setMode('highlight')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'highlight'
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                type="button"
              >
                Highlight
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              type="button"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Editor Panel */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {mode === 'write' ? 'Write' : 'Highlight'}
            </h2>

            <div className="relative">
              {mode === 'write' ? (
                // Free Write Mode - Editable textarea
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your thoughts..."
                  className="h-96 w-full resize-none rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              ) : (
                // Highlight Mode - Two separate sections
                <div className="space-y-4">
                  {/* Selection textarea */}
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onMouseUp={handleTextSelection}
                    onKeyUp={handleTextSelection}
                    readOnly
                    className="h-48 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    placeholder="Switch to Write mode to add content..."
                  />

                  {/* Highlighted text display */}
                  <div className="h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
                    {content ? (
                      renderHighlightedText()
                    ) : (
                      <span className="font-mono text-sm text-gray-500">
                        Highlighted text will appear here...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {mode === 'highlight' && (
              <p className="mt-2 text-sm text-gray-600">
                Select text in the top area to highlight it. View and manage
                highlights in the bottom area. Click on highlights to delete
                them.
              </p>
            )}
          </div>

          {/* Preview Panel */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Preview
            </h2>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{content || '*No content yet...*'}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Highlights Summary */}
        {highlights.length > 0 && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Highlights ({highlights.length})
            </h2>
            <div className="space-y-2">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="flex items-center justify-between rounded-lg bg-yellow-50 p-3"
                >
                  <span className="flex-1 text-sm text-gray-800">
                    &ldquo;{highlight.text.slice(0, 100)}
                    {highlight.text.length > 100 ? '...' : ''}&rdquo;
                  </span>
                  <button
                    onClick={() => deleteHighlight(highlight.id)}
                    className="ml-3 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                    type="button"
                    title="Delete highlight"
                    aria-label="Delete highlight"
                  >
                    <svg
                      className="size-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
