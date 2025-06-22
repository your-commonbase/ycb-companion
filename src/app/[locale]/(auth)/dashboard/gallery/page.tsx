'use client';

import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

interface ImageData {
  id: string;
  url?: string;
  data: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface ImageResponse {
  data: {
    records: ImageData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

const Gallery = () => {
  const router = useRouter();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [initialLoad, setInitialLoad] = useState(false);
  const limit = 50;

  const fetchImages = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/fetchImages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: currentPage,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const result: ImageResponse = await response.json();
      const { data } = result;
      console.log('Fetch images response:', result);

      if (data?.records?.length) {
        const imageIds = data.records.map((img: ImageData) => img.id);

        const imageDetailsResponse = await fetch('/api/fetchImageByIDs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: imageIds,
          }),
        });

        if (imageDetailsResponse.ok) {
          const imageDetails = await imageDetailsResponse.json();
          console.log('Image details response:', imageDetails);

          // Map the records with their CDN URLs
          const imagesWithUrls = data.records.map((record: ImageData) => ({
            ...record,
            url: imageDetails.data?.body?.urls?.[record.id] || null,
          }));

          if (currentPage === 1) {
            setImages(imagesWithUrls);
          } else {
            setImages((prev) => [...prev, ...imagesWithUrls]);
          }
        } else {
          // Just use the records without URLs
          // eslint-disable-next-line
          if (currentPage === 1) {
            setImages(data.records);
          } else {
            setImages((prev) => [...prev, ...data.records]);
          }
        }

        setHasMore(data.pagination.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInitialImages = useCallback(async () => {
    if (!initialLoad) {
      setInitialLoad(true);
      await fetchImages(1);
    }
  }, [fetchImages, initialLoad]);

  const loadMoreImages = useCallback(async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchImages(nextPage);
    }
  }, [loading, hasMore, page, fetchImages]);

  const handleImageClick = (imageId: string) => {
    router.push(`/dashboard/entry/${imageId}`);
  };

  useEffect(() => {
    loadInitialImages();
  }, [loadInitialImages]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Image Gallery</h1>

      {images.length === 0 && !loading && initialLoad && (
        <div className="py-12 text-center text-gray-500">No images found</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {images.map((image) => (
          <div
            key={image.id}
            onKeyDown={(e) => e.key === 'Enter' && handleImageClick(image.id)}
            className="aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-100 transition-opacity hover:opacity-80"
            onClick={() => handleImageClick(image.id)}
            tabIndex={0}
            role="button"
            aria-label={`View image ${image.id}`}
          >
            {image.url ? (
              <img
                src={image.url}
                className="size-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA2MEg2MEMzNS45IDYwIDM2IDg0LjEgMzYgMTA4VjE0MEMzNiAxNjQuMSAzNS45IDE4OCA2MCAxODhIODQuMUgxNDBDMTY0LjEgMTg4IDE4OCAxNjQuMSAxODggMTQwVjEwOEM4OCA4NC4xIDE2NC4xIDYwIDE0MCA2MEwxMjUgNjBNNzUgNjBWNzVIMTI1VjYwTTc1IDYwIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=';
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-gray-200 text-gray-500">
                <svg
                  className="size-12"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="py-8 text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Loading images...</p>
        </div>
      )}

      {hasMore && !loading && images.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMoreImages}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            type="button"
          >
            Load More Images
          </button>
        </div>
      )}

      {!hasMore && images.length > 0 && (
        <div className="py-8 text-center text-gray-500">
          No more images to load
        </div>
      )}
    </div>
  );
};

export default Gallery;
