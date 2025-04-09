'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import { InstagramEmbed, TikTokEmbed } from 'react-social-media-embed';
import { Spotify } from 'react-spotify-embed';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Tweet } from 'react-tweet';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import ForceDirectedGraph from '../ForceDirectedGraph';
import { fetchByID, updateEntry } from '@/helpers/functions';
import { v4 as uuidv4 } from 'uuid';

const EntryGraphPage = () => {
  const { id } = useParams();
  const pathname = usePathname();
  const [data, setData] = useState<any>(null);
  const [fData, setFData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});
  const [tempComments, setTempComments] = useState<{ [key: string]: any[] }>({});

  // Embed states
  const [hasYouTubeEmbed, setHasYoutubeEmbed] = useState(false);
  const [youtubeId, setYoutubeId] = useState('');
  const [youtubeStart, setYoutubeStart] = useState(0);
  const [hasTwitterEmbed, setHasTwitterEmbed] = useState(false);
  const [tweetId, setTweetId] = useState('');
  const [hasInstagramEmbed, setHasInstagramEmbed] = useState(false);
  const [hasTikTokEmbed, setHasTikTokEmbed] = useState(false);
  const [hasSpotifyEmbed, setHasSpotifyEmbed] = useState(false);
  const [hasCodeBlock, setHasCodeBlock] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [hasR2Dev, setHasR2Dev] = useState(false);

  const router = useRouter();

  // Check for embeds in the entry
  const checkEmbeds = (res: { data: any; metadata: any }) => {
    if (res.metadata.author.includes('youtube.com')) {
      setHasYoutubeEmbed(true);
      setYoutubeId(res.metadata.author.split('v=')[1]?.split('&')[0]);
      if (res.metadata.author.includes('t=')) {
        setYoutubeStart(parseInt(res.metadata.author.split('t=')[1].split('s')[0], 10));
      }
    }

    if (res.metadata.author.includes('twitter.com') || /^https:\/\/(www\.)?x\.com/.test(res.metadata.author)) {
      setHasTwitterEmbed(true);
      setTweetId(res.metadata.author.split('/').pop() || '');
    }

    if (res.metadata.author.includes('instagram.com')) {
      setHasInstagramEmbed(true);
    }

    if (res.metadata.author.includes('tiktok.com')) {
      setHasTikTokEmbed(true);
    }

    if (res.metadata.author.includes('imagedelivery.net')) {
      setHasImage(true);
    }

    if (res.metadata.author.includes('open.spotify.com')) {
      setHasSpotifyEmbed(true);
    }

    if (res.metadata.code) {
      setHasCodeBlock(true);
    }

    if (res.metadata.author.includes('r2.dev')) {
      setHasR2Dev(true);
    }
  };

  // Load entry data
  useEffect(() => {
    if (!data) {
      const asyncFn = async () => {
        const id = pathname.split('/').pop();
        if (!id) return;
        const entryId = Array.isArray(id) ? id[0] : id;
        if (!entryId) return;

        try {
          const dt = await fetchByID(entryId);
          
          if ('alias_ids' in dt.metadata) {
            const aliasData = await Promise.all(
              dt.metadata.alias_ids.map((aliasId: string) => fetchByID(aliasId))
            );
            
            dt.metadata.aliasData = aliasData
              .map((ad) => ({
                aliasData: ad.data,
                aliasId: ad.id,
                aliasCreatedAt: ad.createdAt,
                aliasUpdatedAt: ad.updatedAt || ad.createdAt,
                aliasMetadata: ad.metadata,
              }));
          }

          checkEmbeds(dt);
          setData({
            data: dt.data,
            metadata: dt.metadata,
            id: dt.id,
            createdAt: dt.createdAt,
            updatedAt: dt.updatedAt || dt.createdAt,
            action: dt.createdAt === dt.updatedAt ? 'added' : 'updated',
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading entry:', error);
          setError('Failed to load entry');
          setIsLoading(false);
        }
      };
      asyncFn();
    }
  }, [pathname, data]);

  // Initialize graph data when entry data is loaded
  useEffect(() => {
    const asyncFn = async () => {
      if (!data) return;
      
      setFData({
        entry: data,
        neighbors: [],
        comments: [],
        internalLinks: [],
        expansion: []
      });

      // Generate initial graph data
      await generateFData(data, data.metadata.aliasData || []);
    };
    asyncFn();
  }, [data]);

  const generateFData = async (entry: any, comments: any[] = []) => {
    setIsGraphLoading(true);

    // Process comments
    const processedComments = comments.map((comment: any) => ({
      id: comment.aliasId,
      comment: comment.aliasData,
      penPals: [],
      createdAt: comment.aliasCreatedAt,
      updatedAt: comment.aliasUpdatedAt
    }));

    // Update fData with processed data
    setFData((prevData: any) => ({
      ...prevData,
      comments: processedComments
    }));

    setIsGraphLoading(false);
  };

  // Process markdown-style content
  const processCustomMarkdown = (text: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const lines = text.split('\n');

    lines.forEach((line) => {
      elements.push(
        <span
          key={`line-${Math.random()}`}
          style={{ display: 'block', marginBottom: '1em' }}
        >
          {line}
        </span>,
      );
    });

    return elements;
  };

  // Add comment handling function
  const addCommentToEntry = async (
    commentText: string,
    parentEntry: { id: string; data: string; metadata: any },
  ) => {
    // Add temporary comment to UI immediately
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

    setIsSaving((prev) => ({ ...prev, [parentEntry.id]: true }));

    try {
      // Add comment to database
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

      // Update parent entry's metadata
      const parentRes = await fetchByID(parentEntry.id);
      const parentResMetadata = parentRes.metadata;

      const updatedAliasIds = parentResMetadata.alias_ids
        ? [...parentResMetadata.alias_ids, addedCommentData.id]
        : [addedCommentData.id];

      await updateEntry(parentEntry.id, parentEntry.data, {
        ...parentResMetadata,
        alias_ids: updatedAliasIds,
      });

      // Remove temporary comment
      setTempComments((prev) => ({
        ...prev,
        [parentEntry.id]: [],
      }));

      // Refresh data
      const dt = await fetchByID(parentEntry.id);
      if ('alias_ids' in dt.metadata) {
        const aliasData = await Promise.all(
          dt.metadata.alias_ids.map((aliasId: string) => fetchByID(aliasId))
        );
        
        dt.metadata.aliasData = aliasData
          .map((ad) => ({
            aliasData: ad.data,
            aliasId: ad.id,
            aliasCreatedAt: ad.createdAt,
            aliasUpdatedAt: ad.updatedAt || ad.createdAt,
            aliasMetadata: ad.metadata,
          }));
      }
      setData(dt);

      // Update graph data
      await generateFData(dt, dt.metadata.aliasData || []);

    } catch (error) {
      console.error('Error adding comment:', error);
      // Clean up temporary comment if save failed
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

  const handleExpand = async (nodeId: string, initNodeData: string | null = null) => {
    setIsGraphLoading(true);
    try {
      // Here you would implement the expansion logic
      // For now, we'll just set loading to false
      setIsGraphLoading(false);
    } catch (err) {
      console.error('Error expanding node:', err);
      setIsGraphLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!data) return;
    
    // Check if there are alias IDs
    if (data.metadata.alias_ids && data.metadata.alias_ids.length > 0) {
      alert('Please delete all comments before deleting the entry.');
      return;
    }

    // Confirm deletion
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this entry?'
    );
    if (!confirmDelete) return;

    try {
      // Attempt to delete the entry via API
      const response = await fetch(`/api/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: data.id }),
      });

      if (response.ok) {
        window.close();
      } else {
        throw new Error('Failed to delete entry');
      }
    } catch (error) {
      alert('Failed to delete entry. Please try again.');
      console.error('Error deleting entry:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!data) {
    return <div>No data found</div>;
  }

  return (
    <div className="space-y-8 max-w-screen-md mx-auto p-8">
      {fData && (
        <div className="relative border border-black">
          <ForceDirectedGraph
            data={fData}
            onExpand={handleExpand}
            isGraphLoading={isGraphLoading}
            onAddComment={addCommentToEntry}
            graphNodes={graphNodes}
            setGraphNodes={setGraphNodes}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            showModal={showModal}
            setShowModal={setShowModal}
          />
          {isGraphLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75">
              <span className="text-lg font-bold">Loading...</span>
            </div>
          )}
        </div>
      )}
      <div className=" flex flex-col gap-4">
        <div className="flex flex-col border border-black">
          <div className="flex w-full flex-row border-b border-black">
            <div className="w-2/3 border-r border-dotted border-black px-4 py-3">
              {data.metadata.title}
            </div>
            <div className="w-1/3 px-4 py-3 text-center">
              Created: {new Date(data.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {/* Embeds */}
            {hasYouTubeEmbed && (
              <LiteYouTubeEmbed
                id={youtubeId}
                params={`start=${youtubeStart}`}
                title="YouTube video"
              />
            )}
            {hasImage && (
              <img src={data.metadata.author} alt="" className="h-auto w-full" />
            )}
            {hasTwitterEmbed && <Tweet id={tweetId} />}
            {hasSpotifyEmbed && <Spotify link={data.metadata.author} wide />}
            {hasInstagramEmbed && <InstagramEmbed url={data.metadata.author} />}
            {hasTikTokEmbed && <TikTokEmbed url={data.metadata.author} />}
            {hasCodeBlock && (
              <SyntaxHighlighter
                language={
                  data.metadata.language === 'typescriptreact'
                    ? 'tsx'
                    : data.metadata.language
                }
                style={docco}
                wrapLines
                wrapLongLines
              >
                {data.metadata.code}
              </SyntaxHighlighter>
            )}
            {hasR2Dev && (
              <audio controls src={data.metadata.author}>
                <track kind="captions" />
                Your browser does not support the audio element.
              </audio>
            )}
            <div>{processCustomMarkdown(data.data)}</div>
            <div className="text-xs text-gray-500">
              {data.action === 'added' ? 'Added' : 'Updated'}{' '}
              {new Date(data.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Comments/Aliases Section */}
        {data.metadata.aliasData && data.metadata.aliasData.length > 0 && (
          <div className="flex flex-col gap-4">
            {data.metadata.aliasData.map((alias: {
              aliasId: string;
              aliasData: string;
              aliasCreatedAt: string;
              aliasUpdatedAt: string;
              aliasMetadata: {
                title: string;
                author: string;
                parent_id: string;
              };
            }) => (
              <div key={alias.aliasId} className="flex flex-col gap-2 p-4 border border-black">
                <div>{processCustomMarkdown(alias.aliasData)}</div>
                <div className="text-xs text-gray-500">
                  Comment Added {new Date(alias.aliasCreatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Display temporary comments */}
        {tempComments[data.id]?.map((tempComment: any) => (
          <div key={tempComment.aliasId} className="flex flex-col gap-2 p-4 border border-black">
            <div>{processCustomMarkdown(tempComment.aliasData)}</div>
            <div className="text-xs text-gray-500">Saving...</div>
          </div>
        ))}

        {/* Comment Input Section */}
        <div className="flex flex-col border border-black">
          <div className="flex w-full flex-col">
            <textarea
              className="size-full resize-none overflow-hidden border-none bg-transparent p-4 outline-none focus:outline-none focus:ring-0"
              placeholder="Add a comment..."
            />
            <button
              type="button"
              className="flex w-full items-center justify-center bg-black py-4"
              onClick={(e) => {
                const textarea = e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement | null;
                if (!textarea) return;
                const commentText = textarea.value.trim();
                if (commentText) {
                  addCommentToEntry(commentText, data);
                  textarea.value = '';
                }
              }}
              disabled={isSaving[data.id]}
            >
              {isSaving[data.id] ? (
                <span className="text-white">Saving...</span>
              ) : (
                <img src="/light-plus.svg" alt="plus" className="w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Delete Entry Button */}
        <button
          type="button"
          onClick={handleDeleteEntry}
          className="mt-8 w-full flex items-center justify-center py-4 text-white bg-[#FF5152]"
        >
          Delete Entry
        </button>
      </div>
    </div>
  );
};

export default EntryGraphPage;
