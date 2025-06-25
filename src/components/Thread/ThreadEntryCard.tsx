'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import html2canvas from 'html2canvas';
import { useEffect, useRef, useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import ReactMarkdown from 'react-markdown';
import { InstagramEmbed } from 'react-social-media-embed';
import { Tweet } from 'react-tweet';

import ImageUpload from '@/components/ImageUpload';
import { fetchRandomEntry } from '@/helpers/functions';
import { enqueueAddText, enqueueAddURL } from '@/hooks/useAddQueue';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

import LinkPreviewCard from '../LinkPreview';
import type { FlattenedEntry, ThreadEntryCardProps } from './types';
import { calculateFontSize, convertDate, timeAgo } from './utils';

const ThreadEntryCard: React.FC<ThreadEntryCardProps> = ({
  entry,
  onRelationshipExpand,
  onNavigateToEntry,
  onAddNewEntry,
  onImageUpload,
  onUrlUpload,
  expandedRelationships = new Set(),
  allEntryIds = new Set(),
  loadingRelationships = new Set(),
  maxDepth,
  onOpenTreeModal,
  isCurrentEntry = false,
}) => {
  const [cdnImageUrl, setCdnImageUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.data);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingURL, setIsAddingURL] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const [randomCommentPlaceholder, setRandomCommentPlaceholder] =
    useState('Add a comment...');
  const [isEmbedsExpanded, setIsEmbedsExpanded] = useState(false);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  console.log('entry id:', entry.id);
  console.log('entry level:', entry.level);

  // Calculate dynamic font size based on content length
  const dynamicFontSize = calculateFontSize(entry.data.length);

  // Intersection observer for animations
  const { targetRef, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '0px',
    freezeOnceVisible: true,
  });

  const { metadata } = entry;
  const aliasIds: string[] = metadata.alias_ids || [];
  const parentId =
    metadata.parent_id && metadata.parent_id.trim() !== ''
      ? metadata.parent_id
      : null;

  useEffect(() => {
    const asyncFn = async () => {
      const rentry = await fetchRandomEntry();
      setRandomCommentPlaceholder(rentry.data);
    };
    asyncFn();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsActionsDropdownOpen(false);
      }
    };

    if (isActionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionsDropdownOpen]);

  useEffect(() => {
    if (metadata.type === 'image') {
      const fetchData = async () => {
        const { id } = entry;
        const cdnResp = await fetch(`/api/fetchImageByIDs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: [id],
          }),
        });
        const cdnData = await cdnResp.json();

        setCdnImageUrl(
          cdnData.data.body.urls[id] ? cdnData.data.body.urls[id] : '',
        );
      };

      fetchData();
    }
  }, [metadata.type]);

  const updateEntry = async (newText: string) => {
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: entry.id,
          data: newText,
          metadata: entry.metadata,
        }),
      });

      if (response.ok) {
        // eslint-disable-next-line no-param-reassign
        entry.data = newText;
        setIsEditing(false);
      } else {
        console.error('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleSave = () => {
    updateEntry(editText);
  };

  const handleCancel = () => {
    setEditText(entry.data);
    setIsEditing(false);
  };

  const takeDirectScreenshot = async () => {
    try {
      const cardElement = document.getElementById(`entry-${entry.id}`);
      if (!cardElement) {
        console.error('Card element not found');
        return;
      }

      // Convert CDN image to base64 if needed for screenshot
      let originalImageSrc = '';
      let imageElement: HTMLImageElement | null = null;

      if (metadata.type === 'image' && cdnImageUrl) {
        console.log('Converting image to base64 for screenshot:', cdnImageUrl);

        try {
          const response = await fetch('/api/imageToBase64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: cdnImageUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            const imageBase64 = data.base64;
            const imageContentType = data.contentType;

            // Find the image element and replace its src temporarily
            imageElement = cardElement.querySelector(
              'img[src*="cloudfront"]',
            ) as HTMLImageElement;
            if (imageElement && imageBase64) {
              originalImageSrc = imageElement.src;
              imageElement.src = `data:${imageContentType};base64,${imageBase64}`;
              console.log('Temporarily replaced image src for screenshot');

              // Wait for image to load
              await new Promise((resolve) => {
                if (imageElement!.complete) {
                  resolve(0);
                } else {
                  imageElement!.onload = () => resolve(0);
                  imageElement!.onerror = () => resolve(0);
                }
              });
            }
          }
        } catch (conversionError) {
          console.error(
            'Image conversion failed for screenshot:',
            conversionError,
          );
        }
      }

      // Hide action buttons during screenshot
      const actionButtons = cardElement.querySelector(
        '.border-t.border-gray-100.pt-4',
      );
      const addButtons = cardElement.querySelector(
        '.mt-4.flex.flex-wrap.gap-3.border-t.border-gray-100.pt-4',
      );

      if (actionButtons) (actionButtons as HTMLElement).style.display = 'none';
      if (addButtons) (addButtons as HTMLElement).style.display = 'none';

      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore original image src if it was changed
      if (imageElement && originalImageSrc) {
        imageElement.src = originalImageSrc;
        console.log('Restored original image src');
      }

      // Restore buttons
      if (actionButtons) (actionButtons as HTMLElement).style.display = '';
      if (addButtons) (addButtons as HTMLElement).style.display = '';

      // Download screenshot
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `thread-entry-${entry.id.slice(0, 8)}-screenshot.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  };

  const handleNativeShare = async () => {
    try {
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isSecureContext =
        window.isSecureContext || window.location.protocol === 'https:';

      console.log('Is mobile:', isMobile);
      console.log('Is secure context:', isSecureContext);
      console.log('Web Share API available:', 'share' in navigator);
      console.log('Navigator canShare available:', 'canShare' in navigator);

      const shareText = `${entry.data}

${entry.metadata.author ? `Source: ${entry.metadata.author}` : ''}
Created: ${new Date(entry.createdAt).toLocaleDateString()}

Your Commonbase`;

      const shareData: ShareData = {
        title: `Thread Entry - ${entry.id.slice(0, 8)}`,
        text: shareText,
        url: window.location.href,
      };

      // If this is an image entry and we're on mobile with share support, include the image file
      if (
        metadata.type === 'image' &&
        cdnImageUrl &&
        'share' in navigator &&
        isMobile &&
        isSecureContext
      ) {
        try {
          console.log('Fetching image for native share:', cdnImageUrl);

          // Fetch the image
          const response = await fetch('/api/imageToBase64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: cdnImageUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            const imageBase64 = data.base64;
            const imageContentType = data.contentType;

            // Convert base64 to blob
            const byteCharacters = atob(imageBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i += 1) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: imageContentType });

            // Create file from blob
            const fileName = `thread-entry-${entry.id.slice(0, 8)}.${imageContentType.split('/')[1]}`;
            const file = new File([blob], fileName, { type: imageContentType });

            // Check if the browser supports sharing files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file];
              console.log('Including image file in share');
            } else {
              console.log(
                'Browser does not support file sharing, sharing text only',
              );
            }
          }
        } catch (imageError) {
          console.error('Error preparing image for share:', imageError);
          // Continue with text-only share
        }
      }

      // Check if we should use Web Share API (mobile + secure context)
      if (navigator.share && isMobile && isSecureContext) {
        console.log('Attempting native share:', shareData);
        await navigator.share(shareData);
      } else {
        console.log('Using clipboard fallback for desktop browser');
        // For desktop browsers or unsupported environments, copy to clipboard
        await navigator.clipboard.writeText(shareText);

        if (metadata.type === 'image' && cdnImageUrl) {
          alert(
            'Text copied to clipboard! For images on desktop, try the "Screenshot" or "HTML File" options instead.',
          );
        } else {
          alert('Content copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to clipboard if share fails
      try {
        const shareText = `${entry.data}

${entry.metadata.author ? `Source: ${entry.metadata.author}` : ''}
Created: ${new Date(entry.createdAt).toLocaleDateString()}

- <3, Your Commonbase`;

        await navigator.clipboard.writeText(shareText);
        alert('Content copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard fallback failed:', clipboardError);
      }
    }
  };

  const handleShareHTML = async () => {
    try {
      // Convert image to base64 first if needed
      let imageBase64 = '';
      let imageContentType = 'image/webp';
      let imageConversionFailed = false;

      if (metadata.type === 'image' && cdnImageUrl) {
        console.log('Converting image to base64:', cdnImageUrl);
        try {
          const response = await fetch('/api/imageToBase64', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: cdnImageUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            imageBase64 = data.base64;
            imageContentType = data.contentType;
            console.log('Base64 conversion result length:', imageBase64.length);

            if (!imageBase64 || imageBase64.length < 100) {
              console.warn(
                'Base64 conversion resulted in empty or very short string',
              );
              imageConversionFailed = true;
            }
          } else {
            throw new Error(`API error: ${response.status}`);
          }
        } catch (conversionError) {
          console.error('Image conversion failed:', conversionError);
          imageConversionFailed = true;
        }
      }

      // Get the main content area (without action buttons)
      const contentHtml = `
        <div class="w-full rounded-xl border-2 bg-white shadow-lg p-6">
          <div class="prose prose-lg max-w-none mb-6">
            <div class="text-lg leading-relaxed text-gray-900">${entry.data}</div>
          </div>

          ${
            entry.metadata.title
              ? `
            <a class="inline-block text-sm text-gray-500 hover:text-blue-600 hover:underline mb-4" 
               href="${entry.metadata.author}" target="_blank">
              ${entry.metadata.title}
            </a>
          `
              : ''
          }


          ${
            // eslint-disable-next-line no-nested-ternary
            metadata.type === 'image' && imageBase64 && !imageConversionFailed
              ? `
            <div class="mt-4">
              <img src="data:${imageContentType};base64,${imageBase64}" 
                   alt="Entry content" 
                   class="h-auto max-w-full rounded-lg shadow-md" />
            </div>
          `
              : metadata.type === 'image' && cdnImageUrl
                ? `
            <div class="mt-4">
              <div class="bg-gray-200 rounded-lg p-8 text-center text-gray-500">
                <p class="font-medium mb-2">[Image could not be embedded]</p>
                <p class="text-sm">This shared version could not include the original image due to technical limitations.</p>
                <p class="text-xs mt-2 font-mono break-all">Source: ${cdnImageUrl.substring(0, 80)}${cdnImageUrl.length > 80 ? '...' : ''}</p>
              </div>
            </div>
          `
                : ''
          }

          <div class="mt-6 text-xs text-gray-400 text-center">
            Generated from YCB Companion - ${new Date().toLocaleString()}
          </div>
        </div>
      `;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thread Entry - ${entry.id.slice(0, 8)}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
        .prose { max-width: none; }
        .prose p { margin-bottom: 1rem; }
        .prose h1, .prose h2, .prose h3 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .screenshot-btn { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 1000;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .screenshot-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .screenshot-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        @media print {
            .screenshot-btn { display: none; }
        }
    </style>
</head>
<body class="bg-gray-50 p-8">
    <button class="screenshot-btn" onclick="takeScreenshot()" id="screenshotBtn">
        📸 Download Screenshot
    </button>
    
    <div class="mx-auto max-w-2xl" id="content">
        ${contentHtml}
    </div>

    <script>
        async function takeScreenshot() {
            const button = document.getElementById('screenshotBtn');
            const content = document.getElementById('content');
            
            // Disable button and show loading state
            button.disabled = true;
            button.textContent = '📸 Creating screenshot...';
            
            try {
                // Hide the button temporarily
                button.style.display = 'none';
                
                // Create canvas from the content
                const canvas = await html2canvas(content, {
                    backgroundColor: '#f9fafb',
                    scale: 2, // Higher resolution
                    useCORS: true,
                    allowTaint: true,
                    scrollX: 0,
                    scrollY: 0,
                    width: content.scrollWidth,
                    height: content.scrollHeight
                });
                
                // Convert to blob and download
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'thread-entry-${entry.id.slice(0, 8)}-screenshot.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 'image/png');
                
            } catch (error) {
                console.error('Error taking screenshot:', error);
                alert('Failed to create screenshot. Please try again.');
            } finally {
                // Restore button
                button.style.display = 'block';
                button.disabled = false;
                button.textContent = '📸 Download Screenshot';
            }
        }
    </script>
</body>
</html>`;

      // Create and download the HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thread-entry-${entry.id.slice(0, 8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating HTML file:', error);
    }
  };

  const addComment = (
    aliasInput: string,
    parent: { id: string; data: string; metadata: any },
  ) => {
    enqueueAddText(
      {
        data: aliasInput,
        metadata: {
          parent_id: parent.id,
          title: parent.metadata.title,
          author: parent.metadata.author,
        },
        parentId: parent.id,
      },
      (addedCommentData) => {
        const newEntry: FlattenedEntry = {
          id: addedCommentData.id,
          data: aliasInput,
          comments: [],
          createdAt: addedCommentData.createdAt,
          metadata: {
            ...addedCommentData.metadata,
            parent_id: parent.id,
          },
          relationshipType: 'comment',
          relationshipSource: parent.id,
          level: entry.level + 1,
          hasMoreRelations: true,
        };
        onAddNewEntry(newEntry, parent.id);
      },
    );
  };

  const addURL = async (
    url: string,
    parent: { id: string; data: string; metadata: any },
  ) => {
    enqueueAddURL(
      {
        url,
        metadata: {
          parent_id: parent.id,
        },
      },
      (addedCommentData) => {
        onUrlUpload(addedCommentData, parent.id);
      },
    );
  };

  // Get relationship indicator styling
  const getRelationshipStyle = () => {
    switch (entry.relationshipType) {
      case 'root':
        return 'border-l-4 bg-blue-50';
      case 'parent':
        return 'border-l-4 bg-purple-50';
      case 'comment':
        return 'border-l-4  bg-orange-50';
      case 'neighbor':
        return 'border-l-4  bg-green-50';
      default:
        return 'border-l-4 -300 bg-white';
    }
  };

  // Get animation direction based on entry type and similarity
  const getAnimationDirection = () => {
    if (entry.relationshipType === 'root') {
      return 'animate-fade-in'; // No direction for root
    }

    if (entry.relationshipType === 'parent') {
      return 'animate-fade-in-from-top';
    }

    if (entry.relationshipType === 'comment') {
      return 'animate-fade-in-from-bottom';
    }

    if (entry.relationshipType === 'neighbor') {
      // For related entries, use similarity to determine direction
      const similarity = entry.similarity || 0;
      if (similarity < 0.5) {
        return 'animate-fade-in-from-left';
      }
      return 'animate-fade-in-from-right';
    }

    return 'animate-fade-in';
  };

  // Get the animation classes
  const getAnimationClasses = () => {
    if (entry.relationshipType === 'root') {
      return hasBeenVisible ? 'opacity-100' : 'opacity-100'; // Root is always visible
    }

    const baseClasses = 'transition-all duration-700 ease-out';
    const animationDirection = getAnimationDirection();

    if (hasBeenVisible) {
      return `${baseClasses} opacity-100 translate-x-0 translate-y-0`;
    }
    // Initial state before animation
    let initialState = 'opacity-0';

    if (animationDirection.includes('from-top')) {
      initialState += ' -translate-y-8';
    } else if (animationDirection.includes('from-bottom')) {
      initialState += ' translate-y-8';
    } else if (animationDirection.includes('from-left')) {
      initialState += ' -translate-x-8';
    } else if (animationDirection.includes('from-right')) {
      initialState += ' translate-x-8';
    }

    return `${baseClasses} ${initialState}`;
  };

  return (
    <div
      ref={targetRef}
      id={`entry-${entry.id}`}
      className={`flex h-[600px] w-full flex-col rounded-xl border-2 bg-white shadow-lg hover:shadow-xl ${getRelationshipStyle()} ${getAnimationClasses()} ${
        isCurrentEntry ? 'border-l-4 border-l-gray-800' : ''
      }`}
    >
      {/* Header with relationship indicator */}
      {entry.relationshipType !== 'root' && (
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-3">
            {entry.relationshipSource && (
              <button
                onClick={() => {
                  const targetElement = document.getElementById(
                    `entry-${entry.relationshipSource}`,
                  );
                  if (targetElement) {
                    targetElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    // Add a brief highlight effect
                    targetElement.style.transition =
                      'background-color 0.3s ease';
                    targetElement.style.backgroundColor =
                      'rgba(59, 130, 246, 0.1)';
                    setTimeout(() => {
                      targetElement.style.backgroundColor = '';
                    }, 1000);
                  }
                }}
                className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                type="button"
              >
                ← from {entry.relationshipSource.slice(0, 8)}...
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTreeModal(entry)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              type="button"
              title="Show path to root"
            >
              <svg
                className="size-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5v4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 5v4"
                />
              </svg>
              Tree
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {/* Image Display */}
        {metadata.type === 'image' && (
          <div className="mt-4">
            {
              // eslint-disable-next-line no-nested-ternary
              entry.isProcessing ? (
                <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-100">
                  {entry.tempImageUrl ? (
                    <img
                      src={entry.tempImageUrl}
                      alt="Processing..."
                      className="size-full object-cover opacity-75"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto mb-2 size-8 animate-spin rounded-full border-b-2 border-blue-500" />
                        <p className="text-sm text-gray-500">
                          Processing image...
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="size-4 animate-spin rounded-full border-b-2 border-blue-500" />
                        Processing...
                      </div>
                    </div>
                  </div>
                </div>
              ) : cdnImageUrl ? (
                <img
                  src={cdnImageUrl}
                  alt="Entry content"
                  className="h-auto max-w-full rounded-lg shadow-md"
                />
              ) : null
            }
          </div>
        )}
        {/* Entry Content */}
        <div className="mb-6 flex-1 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editText}
                style={{ fontSize: '17px' }}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={6}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  type="button"
                  className="rounded-lg bg-gray-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose max-w-none"
              style={{ fontSize: dynamicFontSize, lineHeight: '1.6' }}
            >
              <ReactMarkdown className="markdown-domine leading-relaxed text-gray-900">
                {entry.data}
              </ReactMarkdown>
            </div>
          )}

          {/* Source Link */}
          {entry.metadata.title && (
            <a
              className="mt-3 inline-block text-sm text-gray-500 hover:text-blue-600 hover:underline"
              href={entry.metadata.author}
              target="_blank"
              rel="noopener noreferrer"
            >
              {entry.metadata.title}
            </a>
          )}

          {/* URL Processing Indicator */}
          {entry.isProcessing &&
            entry.data &&
            entry.data.startsWith('URL: ') && (
              <div className="mt-4">
                <div className="relative rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-6 animate-spin rounded-full border-b-2 border-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Processing URL...
                      </p>
                      <p className="text-xs text-blue-700">
                        Extracting title, description, and metadata
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Social Media Embeds */}
        {((entry.metadata.author &&
          !entry.metadata.author.includes('yourcommonbase.com') &&
          !entry.metadata.author.includes('instagram.com') &&
          !entry.metadata.author.includes('x.com') &&
          !entry.metadata.author.includes('youtube.com') &&
          (entry.metadata.ogTitle || entry.metadata.ogDescription) &&
          entry.metadata.ogImages &&
          entry.metadata.ogImages.length > 0) ||
          (entry.metadata.author &&
            entry.metadata.author.includes('instagram.com')) ||
          (entry.metadata.author &&
            entry.metadata.author.includes('youtube.com')) ||
          (entry.metadata.author &&
            (entry.metadata.author.includes('twitter.com') ||
              (entry.metadata.author.includes('x.com') &&
                entry.metadata.author.includes('status'))))) && (
          <div className="space-y-4">
            {!isEmbedsExpanded && (
              <button
                onClick={() => setIsEmbedsExpanded(true)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none"
                type="button"
              >
                📎 Show embeds
              </button>
            )}
            {isEmbedsExpanded && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Embeds
                  </span>
                  <button
                    onClick={() => setIsEmbedsExpanded(false)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                    type="button"
                  >
                    Hide
                  </button>
                </div>
                {entry.metadata.author &&
                  !entry.metadata.author.includes('yourcommonbase.com') &&
                  !entry.metadata.author.includes('instagram.com') &&
                  !entry.metadata.author.includes('x.com') &&
                  !entry.metadata.author.includes('youtube.com') &&
                  (entry.metadata.ogTitle || entry.metadata.ogDescription) &&
                  entry.metadata.ogImages &&
                  entry.metadata.ogImages.length > 0 && (
                    <LinkPreviewCard
                      url={entry.metadata.author}
                      title={entry.metadata.ogTitle}
                      description={entry.metadata.ogDescription}
                      image={entry.metadata.ogImages[0]}
                    />
                  )}
                {entry.metadata.author &&
                  entry.metadata.author.includes('instagram.com') && (
                    <InstagramEmbed url={entry.metadata.author} />
                  )}
                {entry.metadata.author &&
                  entry.metadata.author.includes('youtube.com') && (
                    <LiteYouTubeEmbed
                      id={entry.metadata.author.split('v=')[1]?.split('&')[0]}
                      title="YouTube video"
                    />
                  )}
                {entry.metadata.author &&
                  (entry.metadata.author.includes('twitter.com') ||
                    (entry.metadata.author.includes('x.com') &&
                      entry.metadata.author.includes('status'))) && (
                    <Tweet id={entry.metadata.author.split('status/')[1]} />
                  )}
              </>
            )}
          </div>
        )}

        {/* Metadata and Actions Footer */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side - Relationship indicators */}
            <div className="flex flex-wrap gap-2">
              {aliasIds.length > 0 &&
                aliasIds.some((id) => !allEntryIds.has(id)) &&
                entry.level < maxDepth && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRelationshipExpand(entry.id, 'comments')}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        expandedRelationships.has(`${entry.id}-comments`)
                          ? 'cursor-default bg-gray-200 text-gray-600'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                      disabled={
                        expandedRelationships.has(`${entry.id}-comments`) ||
                        loadingRelationships.has(`${entry.id}-comments`)
                      }
                    >
                      {aliasIds.length} comment
                      {aliasIds.length !== 1 ? 's' : ''}
                    </button>
                    {loadingRelationships.has(`${entry.id}-comments`) && (
                      <div className="size-4 animate-spin rounded-full border-b-2 border-orange-500" />
                    )}
                  </div>
                )}
              {parentId &&
                !allEntryIds.has(parentId) &&
                entry.level < maxDepth && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRelationshipExpand(entry.id, 'parent')}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        expandedRelationships.has(`${entry.id}-parent`)
                          ? 'cursor-default bg-gray-200 text-gray-600'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                      disabled={
                        expandedRelationships.has(`${entry.id}-parent`) ||
                        loadingRelationships.has(`${entry.id}-parent`)
                      }
                    >
                      has parent
                    </button>
                    {loadingRelationships.has(`${entry.id}-parent`) && (
                      <div className="size-4 animate-spin rounded-full border-b-2 border-purple-500" />
                    )}
                  </div>
                )}
              {entry.hasMoreRelations && entry.level < maxDepth && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRelationshipExpand(entry.id, 'neighbors')}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      expandedRelationships.has(`${entry.id}-neighbors`)
                        ? 'cursor-default bg-gray-200 text-gray-600'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                    disabled={
                      expandedRelationships.has(`${entry.id}-neighbors`) ||
                      loadingRelationships.has(`${entry.id}-neighbors`)
                    }
                  >
                    see related
                  </button>
                  {loadingRelationships.has(`${entry.id}-neighbors`) && (
                    <div className="size-4 animate-spin rounded-full border-b-2 border-green-500" />
                  )}
                </div>
              )}
              {entry.similarity !== undefined && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {Math.round(entry.similarity * 100)}% similar
                </span>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
              <a
                href={`/dashboard/garden?date=${convertDate(entry.createdAt)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                {timeAgo(entry.createdAt)}
              </a>
              <button
                onClick={() => onNavigateToEntry(entry.id)}
                type="button"
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                {entry.id.slice(0, 8)}...
              </button>
              <div className="relative" ref={actionsDropdownRef}>
                <button
                  onClick={() =>
                    setIsActionsDropdownOpen(!isActionsDropdownOpen)
                  }
                  type="button"
                  className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Actions
                  <svg
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>

                {isActionsDropdownOpen && (
                  <div className="absolute bottom-full right-0 z-10 mb-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                    {/* Synthesize Section */}
                    <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                      Synthesize
                    </div>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        setIsAddingComment(true);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      💬 Add Comment
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        setIsAddingURL(true);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      🔗 Add URL
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        setIsAddingImage(true);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      🖼️ Add Image
                    </button>
                    {!isEditing &&
                      (!entry.metadata.type ||
                        entry.metadata.type === 'text') && (
                        <button
                          onClick={() => {
                            setIsActionsDropdownOpen(false);
                            setIsEditing(true);
                          }}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          ✏️ Edit
                        </button>
                      )}

                    {/* Navigate Section */}
                    <div className="border-y border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                      Navigate
                    </div>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        onNavigateToEntry(entry.id);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      🎯 Go to {entry.id.slice(0, 8)}...
                    </button>
                    <button
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        onOpenTreeModal(entry);
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      🌳 View Tree
                    </button>
                    {parentId && (
                      <button
                        onClick={() => {
                          setIsActionsDropdownOpen(false);
                          onNavigateToEntry(parentId);
                        }}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        👆 From parent {parentId.slice(0, 8)}...
                      </button>
                    )}
                    <a
                      href={`/dashboard/garden?date=${convertDate(entry.createdAt)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsActionsDropdownOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      📅 Go to Calendar
                    </a>

                    {/* Share Section */}
                    <div className="border-y border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                      Share
                    </div>
                    <button
                      onClick={async () => {
                        setIsActionsDropdownOpen(false);
                        await handleNativeShare();
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      📱 Share Text
                    </button>
                    <button
                      onClick={async () => {
                        setIsActionsDropdownOpen(false);
                        await takeDirectScreenshot();
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      📸 Screenshot
                    </button>
                    <button
                      onClick={async () => {
                        setIsActionsDropdownOpen(false);
                        await handleShareHTML();
                      }}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      📄 HTML File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Forms */}
        {isAddingImage && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">
              Add Image
            </h4>
            <ImageUpload
              metadata={{ parent_id: entry.id }}
              onUploadComplete={(result) => {
                onImageUpload(result, entry.id);
                setIsAddingImage(false);
              }}
            />
          </div>
        )}

        {isAddingURL && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">Add URL</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="https://yourcommonbase.com/dashboard"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                id={`link-input-comment-${entry.id}`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const url = document.getElementById(
                      `link-input-comment-${entry.id}`,
                    );
                    if (!url) return;
                    const urlValue = (url as HTMLInputElement).value.trim();
                    if (!urlValue) return;
                    addURL(urlValue, entry);
                    setIsAddingURL(false);
                  }}
                  type="button"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Add URL
                </button>
                <button
                  onClick={() => setIsAddingURL(false)}
                  type="button"
                  className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddingComment && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-lg font-medium text-gray-900">
              Add Comment
            </h4>
            <div className="space-y-3">
              <textarea
                rows={3}
                style={{ fontSize: '17px' }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={randomCommentPlaceholder}
                id={`alias-input-comment-${entry.id}`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const aliasInput = document.getElementById(
                      `alias-input-comment-${entry.id}`,
                    );
                    if (!aliasInput) return;
                    const alias = (aliasInput as HTMLInputElement).value.trim();
                    if (!alias) return;
                    addComment(alias, {
                      id: entry.id,
                      data: entry.data,
                      metadata: entry.metadata,
                    });
                    (aliasInput as HTMLInputElement).value = '';
                    setIsAddingComment(false);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Comment
                </button>
                <button
                  onClick={() => setIsAddingComment(false)}
                  type="button"
                  className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadEntryCard;
