'use client';

import { useState } from 'react';

const SpotifyPlayer = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const playlistId = '37i9dQZF1DX17GkScaAekA';
  const spotifyEmbedUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;

  return (
    <div className="fixed bottom-4 left-4 z-50 hidden md:block">
      <div
        className={`transition-all duration-300 ${
          isMinimized ? 'size-12' : 'h-32 w-80'
        } overflow-hidden rounded-lg bg-black shadow-lg`}
      >
        {isMinimized ? (
          // Minimized state - just Spotify logo
          <button
            onClick={() => setIsMinimized(false)}
            className="flex size-full items-center justify-center text-green-500 hover:bg-gray-900"
            type="button"
            aria-label="Expand Spotify player"
          >
            <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </button>
        ) : (
          // Expanded state - Spotify embed
          <div className="relative size-full">
            {/* Header with minimize button */}
            <div className="flex items-center justify-between bg-gray-900 px-2 py-1">
              <span className="text-xs text-white">Spotify Player</span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white"
                type="button"
                aria-label="Minimize Spotify player"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
            </div>

            {/* Spotify iframe */}
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="100"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify player"
              className="rounded-b-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyPlayer;
