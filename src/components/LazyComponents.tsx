import dynamic from 'next/dynamic';

// Lazy load heavy components
export const LazySearchModal = dynamic(() => import('./SearchModalBeta'), {
  loading: () => <div>Loading search...</div>,
  ssr: false,
});

export const LazyUploader = dynamic(() => import('./UploaderModalWrapper'), {
  loading: () => <div>Loading uploader...</div>,
  ssr: false,
});

export const LazyThread = dynamic(() => import('./Thread'), {
  loading: () => <div>Loading thread...</div>,
  ssr: false,
});

export const LazyForceDirectedGraph = dynamic(
  () => import('./ForceDirectedGraph'),
  {
    loading: () => <div>Loading graph...</div>,
    ssr: false,
  },
);

// Lazy load YouTube embed only when needed
export const LazyYouTubeEmbed = dynamic(
  () => import('react-lite-youtube-embed'),
  {
    loading: () => (
      <div className="h-20 animate-pulse rounded bg-gray-100">
        Loading video...
      </div>
    ),
    ssr: false,
  },
);

// Lazy load chart components
// export const LazyChart = dynamic(() => import('./ui/chart'), {
//   loading: () => (
//     <div className="h-40 animate-pulse rounded bg-gray-100">
//       Loading chart...
//     </div>
//   ),
//   ssr: false,
// });
