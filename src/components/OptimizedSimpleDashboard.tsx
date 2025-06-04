'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import AnimatedNumbers from 'react-animated-numbers';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import { fetchFavicon } from '@/helpers/functions';
import { useAPICache } from '@/hooks/useAPICache';

const OptimizedSimpleDashboard = () => {
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [totalEntries, setTotalEntries] = useState(-1);
  const [todaysEntriesLength, setTodaysEntriesLength] = useState(0);
  const [showLogEmbed, setShowLogEmbed] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);
  const { getCachedOrFetch } = useAPICache();

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchFaviconsAsync = async (entries: any[]) => {
    try {
      // Batch favicon requests
      const faviconPromises = entries.map(async (entry: any) => {
        if (entry.metadata.author) {
          try {
            const favicon = await getCachedOrFetch(
              `favicon:${entry.metadata.author}`,
              () => fetchFavicon(entry.metadata.author),
              30 * 60 * 1000, // Cache favicons for 30 minutes
            );
            return { id: entry.id, favicon: favicon.favicon };
          } catch (error) {
            return { id: entry.id, favicon: '/favicon.ico' };
          }
        }
        return { id: entry.id, favicon: '/favicon.ico' };
      });

      const favicons = await Promise.all(faviconPromises);

      // Update entries with favicons
      setLogEntries((prevEntries) =>
        prevEntries.map((entry) => {
          const faviconData = favicons.find((f) => f.id === entry.id);
          return { ...entry, favicon: faviconData?.favicon || '/favicon.ico' };
        }),
      );
    } catch (error) {
      console.error('Error fetching favicons:', error);
    }
  };

  const fetchAllDashboardData = async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      setIsLoading(true);
      const todayString = getTodayString();

      // Use cached API calls with parallel execution
      const [countData, dailyData, logData] = await Promise.all([
        getCachedOrFetch('dashboard:count', async () => {
          const response = await fetch('/api/count', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          return response.json();
        }),
        getCachedOrFetch(`dashboard:daily:${todayString}`, async () => {
          const response = await fetch('/api/daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: todayString }),
          });
          return response.json();
        }),
        getCachedOrFetch(
          'dashboard:log',
          async () => {
            const response = await fetch('/api/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ limit: 20 }),
            });
            return response.json();
          },
          2 * 60 * 1000,
        ), // Cache log for 2 minutes only
      ]);

      // Process all data
      setTotalEntries(countData.count);
      setTodaysEntriesLength(dailyData.data.length);

      const processedLog = logData.data
        .map((entry: any) => ({
          ...entry,
          action: entry.createdAt === entry.updatedAt ? 'added' : 'updated',
        }))
        .filter((entry: any) => entry !== null);

      // Set YouTube embed state
      processedLog.forEach((entry: any) => {
        if (entry.metadata.author.includes('youtube.com')) {
          setShowLogEmbed((prev) => ({ ...prev, [entry.id]: false }));
        }
      });

      setLogEntries(processedLog);

      // Fetch favicons in background (non-blocking)
      fetchFaviconsAsync(processedLog);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      hasLoaded.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  // Fetch CDN images lazily when needed
  const [cdnImageUrls, setCdnImageUrls] = useState<{ [id: string]: string }>(
    {},
  );

  useEffect(() => {
    const imageEntries = logEntries.filter(
      (entry: any) =>
        entry.metadata.type === 'image' && !cdnImageUrls[entry.id],
    );

    if (imageEntries.length === 0) return;

    const fetchImages = async () => {
      try {
        const ids = imageEntries.map((entry: any) => entry.id);
        const cdnResp = await getCachedOrFetch(
          `images:${ids.join(',')}`,
          async () => {
            const response = await fetch('/api/fetchImageByIDs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids }),
            });
            return response.json();
          },
          10 * 60 * 1000, // Cache images for 10 minutes
        );

        setCdnImageUrls((prev) => ({
          ...prev,
          ...Object.fromEntries(
            ids.map((id: string) => [id, cdnResp.data.body.urls[id] || '']),
          ),
        }));
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, [logEntries.length]); // Only depend on length to avoid excessive requests

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {totalEntries >= 0 && (
        <h2 className="mx-2 mt-8 text-xl font-extrabold text-gray-400 md:text-lg lg:text-lg">
          You have{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {totalEntries}
          </span>{' '}
          total entries in your commonbase. That&apos;s the equivalent of{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {Math.round(totalEntries / 251)}
          </span>{' '}
          journals filled! You are{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {251 - (totalEntries % 251)}
          </span>{' '}
          entries away from filling your next journal!
        </h2>
      )}

      <h2 className="mx-2 mt-8 text-xl font-extrabold text-gray-400 md:text-lg lg:text-lg">
        You have{' '}
        <AnimatedNumbers
          includeComma
          transitions={(index) => ({
            type: 'spring',
            duration: index + 0.3,
          })}
          animateToNumber={todaysEntriesLength}
          fontStyle={{
            fontSize: 18,
            color: 'black',
          }}
        />
        entries today!
      </h2>

      <h1 className="my-4 text-xl font-extrabold text-gray-900 md:text-xl lg:text-xl">
        Recent Activity Log
      </h1>
      <div className="mx-2 my-4 w-full overflow-auto">
        {logEntries.map((entry: any) => (
          <div key={entry.id}>
            <div className="mx-2 mb-4 flex items-center justify-between">
              <div className="grow">
                <Link
                  href={`/dashboard/entry/${entry.id}`}
                  className="block text-gray-900 no-underline"
                  prefetch={false}
                >
                  <div className="relative">
                    {entry.metadata.author &&
                      entry.metadata.author.includes('imagedelivery.net') && (
                        <img
                          src={entry.metadata.author}
                          alt="ycb-companion-image"
                          loading="lazy"
                        />
                      )}
                    <span className="flex items-center font-normal">
                      <img
                        src={entry.favicon || '/favicon.ico'}
                        alt="favicon"
                        className="mr-2 size-6"
                        loading="lazy"
                      />
                      {entry.data}
                    </span>
                  </div>
                </Link>
                <div className="text-sm text-gray-500">
                  {entry.action === 'added' ? <b>Added</b> : <b>Updated</b>}{' '}
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </div>
                {entry.metadata.author.includes('youtube.com') && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      onClick={() => {
                        setShowLogEmbed((prev) => ({
                          ...prev,
                          [entry.id]: !prev[entry.id],
                        }));
                      }}
                    >
                      {showLogEmbed[entry.id] ? 'Hide' : 'Show'} Embed
                    </button>

                    {showLogEmbed[entry.id] && (
                      <div className="mt-2 text-sm text-gray-500">
                        <LiteYouTubeEmbed
                          id={
                            entry.metadata.author.split('v=')[1]?.split('&')[0]
                          }
                          title="YouTube video"
                        />
                      </div>
                    )}
                  </>
                )}
                {entry.metadata.type === 'image' && cdnImageUrls[entry.id] && (
                  <img
                    src={cdnImageUrls[entry.id]}
                    alt="entry"
                    style={{ maxWidth: 200, marginTop: 8 }}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptimizedSimpleDashboard;
