'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import Link from 'next/link';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import { Spotify } from 'react-spotify-embed';
import { v4 as uuidv4 } from 'uuid';

import { fetchByID, updateEntry } from '@/helpers/functions';

const RecentActivityFeed = forwardRef((props, ref) => {
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [openCommentInputs, setOpenCommentInputs] = useState<Set<string>>(
    new Set(),
  );
  const [tempComments, setTempComments] = useState<{ [key: string]: any[] }>(
    {},
  );
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});

  const EXCLUDED_DOMAINS = [
    'youtube.com',
    'imagedelivery.net',
    'yourcommonbase.com',
    'open.spotify.com',
  ];

  const isExternalLink = (url: string) => {
    return (
      url.match(/^https?:\/\/[^\s]+$/) &&
      !EXCLUDED_DOMAINS.some((domain) => url.includes(domain))
    );
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
      const logWithComments = await Promise.all(
        log.map(async (entry: any) => {
          if (entry.metadata.alias_ids?.length > 0) {
            const aliasData = await Promise.all(
              entry.metadata.alias_ids.map((aliasId: string) =>
                fetchByID(aliasId),
              ),
            );
            return {
              ...entry,
              metadata: { ...entry.metadata, aliasData },
            };
          }
          return entry;
        }),
      );

      setLogEntries(logWithComments);
    } catch (error) {
      console.error('Error fetching log entries:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchLogEntries,
  }));

  useEffect(() => {
    fetchLogEntries();
  }, []);

  // Handle comment input for entries
  const addCommentToEntry = async (
    commentText: string,
    parentEntry: { id: string; data: string; metadata: any },
  ) => {
    // add temporary comment to the UI immediately
    const tempCommentId = `temp-${uuidv4()}`;
    setTempComments((prev) => ({
      ...prev,
      [parentEntry.id]: [
        ...(prev[parentEntry.id] || []),
        {
          aliasId: tempCommentId,
          aliasData: commentText,
          aliasCreatedAt: new Date().toISOString(),
          aliasUpdatedAt: new Date().toISOString(),
          aliasMetadata: {
            title: parentEntry.metadata.title,
            author: parentEntry.metadata.author,
            parent_id: parentEntry.id,
          },
        },
      ],
    }));

    // set saving state for entry
    setIsSaving((prev) => ({ ...prev, [parentEntry.id]: true }));

    try {
      // Add the comment to the database
      const addedComment = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: commentText,
          metadata: {
            title: parentEntry.metadata.title,
            author: parentEntry.metadata.author,
            parent_id: parentEntry.id,
          },
        }),
      });

      if (!addedComment.ok) {
        throw new Error(
          `Failed to add comment: ${addedComment.status} ${addedComment.statusText}`,
        );
      }

      const addedCommentRespData = await addedComment.json();
      const addedCommentData = addedCommentRespData.respData;

      // update parent entry's metadata
      const parentRes = await fetchByID(parentEntry.id);
      const parentResMetadata = parentRes.metadata;

      const updatedAliasIds = parentResMetadata.alias_ids
        ? [...parentResMetadata.alias_ids, addedCommentData.id]
        : [addedCommentData.id];

      await updateEntry(parentEntry.id, parentEntry.data, {
        ...parentResMetadata,
        alias_ids: updatedAliasIds,
      });

      // Remove the temporary comment first
      setTempComments((prev) => ({
        ...prev,
        [parentEntry.id]: [],
      }));

      // Fetch fresh data to ensure we have the correct state
      await fetchLogEntries();

      // Close the comment input
      setOpenCommentInputs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(parentEntry.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      // Clean up the temporary comment if save failed
      setTempComments((prev) => ({
        ...prev,
        [parentEntry.id]:
          prev[parentEntry.id]?.filter((c) => c.aliasId !== tempCommentId) ||
          [],
      }));
      alert('Failed to save comment. Please try again.');
    } finally {
      setIsSaving((prev) => ({ ...prev, [parentEntry.id]: false }));
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-xl font-bold">Activity Log</h1>
      <div className="flex flex-col gap-4">
        {logEntries.map((entry: any) => (
          <div
            key={entry.id}
            className="relative flex flex-col border border-black"
          >
            <div className="absolute -right-48 top-1/2 aspect-square w-24 -translate-y-1/2">
              <button
                type="button"
                className="custom-button-pressable w-full p-2"
                onClick={() => {
                  // open entry route in new browser window
                  const screenHeight = window.screen?.availHeight || 768;
                  const newWindowHeight = screenHeight - 100;
                  const newWindowTop = (screenHeight - newWindowHeight) / 2;

                  window.open(
                    `/dashboard/entry/${entry.id}`,
                    '_blank',
                    `width=${800},height=${newWindowHeight},left=${50},top=${newWindowTop},menubar=no,toolbar=no,location=no,status=no`,
                  );
                }}
              >
                <img src="/graph-icon.svg" alt="graph-icon" />
              </button>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {entry.metadata.author &&
                entry.metadata.author.includes('imagedelivery.net') && (
                  <img src={entry.metadata.author} alt="ycb-companion-image" />
                )}
              {entry.metadata.author.includes('youtube.com') && (
                <div className="text-sm text-gray-500">
                  <LiteYouTubeEmbed
                    id={entry.metadata.author.split('v=')[1]?.split('&')[0]}
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
                  <Link
                    href={entry.metadata.author}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {entry.metadata.author}
                  </Link>
                </div>
              )}
              <div>{entry.data}</div>
              <div className="text-xs text-gray-500">
                {entry.action === 'added' ? 'Added' : 'Updated'}{' '}
                {new Date(entry.updatedAt).toLocaleDateString()}
              </div>
            </div>
            {entry.metadata.aliasData &&
              entry.metadata.aliasData.length > 0 && (
                <div className="flex flex-col">
                  {entry.metadata.aliasData.map((alias: any) => {
                    return (
                      <div
                        key={alias.id}
                        className="flex flex-col gap-2 border-t border-black p-4"
                      >
                        <div className="italic text-gray-500">
                          {alias.data || alias.aliasData}
                        </div>
                        <div className="text-xs text-gray-500">
                          {'Comment Added '}
                          {alias.createdAt || alias.aliasCreatedAt
                            ? new Date(
                                alias.createdAt || alias.aliasCreatedAt,
                              ).toLocaleDateString()
                            : 'Just now'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            {/* Display temporary comments */}
            {tempComments[entry.id]?.map((tempComment: any) => (
              <div
                key={tempComment.aliasId}
                className="flex flex-col gap-2 border-t border-black p-4"
              >
                <div className="italic text-gray-500">
                  {tempComment.aliasData}
                </div>
                <div className="text-xs text-gray-500">Saving...</div>
              </div>
            ))}
            {!isSaving[entry.id] && (
              <div className="border-t border-black">
                {openCommentInputs.has(entry.id) ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      className="size-full resize-none overflow-hidden border-none bg-transparent
                        p-4 outline-none
                        focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      className="flex w-full items-center justify-center bg-black py-4"
                      onClick={(e) => {
                        const textarea =
                          e.currentTarget.parentElement?.querySelector(
                            'textarea',
                          ) as HTMLTextAreaElement | null;
                        if (!textarea) return;
                        const commentText = textarea.value.trim();
                        if (commentText) {
                          addCommentToEntry(commentText, entry);
                          textarea.value = '';
                        }
                      }}
                      disabled={isSaving[entry.id]}
                    >
                      {isSaving[entry.id] ? (
                        <span className="text-white">Saving...</span>
                      ) : (
                        <img src="/light-plus.svg" alt="plus" className="w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    <button
                      type="button"
                      className="custom-button-pressable py-3 text-xs"
                      onClick={() => {
                        // Clear any other open comment inputs and set only this one
                        setOpenCommentInputs(new Set([entry.id]));
                      }}
                      disabled={
                        isSaving[entry.id] ||
                        Object.values(isSaving).some((saving) => saving)
                      }
                    >
                      New Comment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

RecentActivityFeed.displayName = 'RecentActivityFeed';

export default RecentActivityFeed;
