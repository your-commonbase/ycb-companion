'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import { Spotify } from 'react-spotify-embed';
import { fetchByID } from '@/helpers/functions';

const RecentActivityFeed = () => {
  const [logEntries, setLogEntries] = useState<any[]>([]);
  
  const EXCLUDED_DOMAINS = ['youtube.com', 'imagedelivery.net', 'yourcommonbase.com', 'open.spotify.com'];
  
  const isExternalLink = (url: string) => {
    return url.match(/^https?:\/\/[^\s]+$/) && !EXCLUDED_DOMAINS.some(domain => url.includes(domain));
  };

  const fetchLogEntries = async () => {
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 20,
        }),
      });
      const data = await response.json();
      
      // Filter out entries with parent_id and add action type
      const log = data.data
        .map((entry: any) => {
          if (entry.metadata.parent_id) {
            return null;
          }
          return {
            ...entry,
            action: entry.createdAt === entry.updatedAt ? 'added' : 'updated',
          };
        })
        .filter((entry: any) => entry !== null);

      // Fetch comment data for each entry
      const logWithComments = await Promise.all(log.map(async (entry: any) => {
        if (entry.metadata.alias_ids?.length > 0) {
          const aliasData = await Promise.all(
            entry.metadata.alias_ids.map((aliasId: string) => fetchByID(aliasId))
          );
          return {
            ...entry,
            metadata: { ...entry.metadata, aliasData },
          };
        }
        return entry;
      }));
  
      setLogEntries(logWithComments);
    } catch (error) {
      console.error('Error fetching log entries:', error);
    }
  };

  useEffect(() => {
    fetchLogEntries();
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-xl font-bold">Activity Log</h1>
      <div className="flex flex-col gap-4">
        {logEntries.map((entry: any) => (
            <div key={entry.id} className="flex flex-col border border-black">
              <div className="flex flex-col gap-2 p-4">
              {entry.metadata.author && 
                entry.metadata.author.includes('imagedelivery.net') && (
                  <img
                    src={entry.metadata.author}
                    alt="ycb-companion-image"
                  />
              )}
              {entry.metadata.author.includes('youtube.com') && (
                <div className="text-sm text-gray-500">
                <LiteYouTubeEmbed
                  id={
                    entry.metadata.author.split('v=')[1]?.split('&')[0]
                  }
                  title="YouTube video"
                />
                </div>
              )}
              {entry.metadata.author.includes('open.spotify.com') && (
                <div className="text-sm text-gray-500">
                  <Spotify link={entry.metadata.author} wide />
                </div>
              )}
              {isExternalLink(entry.metadata.author) && (
                <div className="text-sm text-gray-500">
                  <Link href={entry.metadata.author} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {entry.metadata.author}
                  </Link>
                </div>
              )}
              <div>{entry.data}</div>
              <div className="text-xs text-gray-500">
                {entry.action === 'added' ? 'Added' : 'Updated'}
                {' '}
                {new Date(entry.updatedAt).toLocaleDateString()}
              </div>
              </div>
              {entry.metadata.aliasData && entry.metadata.aliasData.length > 0 && (
                <div className="flex flex-col">
                {entry.metadata.aliasData.map((alias: any) => (
                  <div key={alias.id} className="flex flex-col gap-2 p-4 border-t border-black">
                    <div className="text-gray-500 italic">{alias.data}</div>
                    <div className="text-xs text-gray-500">
                      {"Comment Added "}
                      {new Date(alias.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;