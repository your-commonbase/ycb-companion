'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchByID, fetchRandomEntry } from '@/helpers/functions';

import ForceFromEntry from './ForceFromEntry';

const SimpleDashboard = () => {
  const router = useRouter();

  const [randomEntry, setRandomEntry] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);

  const [firstLastName, setFirstLastName] = useState({
    firstName: '',
    lastName: '',
  });

  // const [inboxEntries, setInboxEntries] = useState<any[]>([]);
  const { user, isLoaded } = useUser();

  const handleRandom = async () => {
    setRandomEntry(null);
    setComments([]);
    // fetch a random entry and open it
    const entry = await fetchRandomEntry();
    // const entry = await fetchByID('9548');
    // if entry has a parent_id, fetch the parent entry
    let { metadata } = entry;
    try {
      metadata = JSON.parse(entry.metadata);
    } catch (err) {
      console.error('Error parsing metadata:', err);
    }
    if (metadata.alias_ids) {
      const commentsList = [];
      const aliasEntries = await Promise.all(
        metadata.alias_ids.map(async (aliasId: string) => {
          const aliasEntry = await fetchByID(aliasId);
          return aliasEntry;
        }),
      );
      for (const aliasEntry of aliasEntries) {
        commentsList.push({
          aliasId: aliasEntry.id,
          aliasData: aliasEntry.data,
          aliasMetadata: aliasEntry.metadata,
        });
      }
      setComments(commentsList);
    }
    if (metadata.parent_id) {
      const parentEntry = await fetchByID(metadata.parent_id);
      setRandomEntry(parentEntry);
      return parentEntry;
    }
    setRandomEntry(entry);
    return entry;
  };

  // const fetchInboxEntries = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await fetch('/api/inbox', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         page: 1,
  //       }),
  //     });
  //     const data = await response.json();
  //     setInboxEntries(data.data);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching inbox entries:', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchInboxEntries();
  // }, []);

  useEffect(() => {
    if (!isLoaded) return;
    // set first name as title
    if (user?.firstName && user?.lastName) {
      setFirstLastName({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const fetchEntry = async () => {
      // fetch random entry
      await handleRandom();
    };
    fetchEntry();
  }, []);

  return (
    <div>
      <h1 className="mb-4 mt-8 text-xl font-extrabold text-gray-900 md:text-xl lg:text-xl">
        Welcome Back to{' '}
        <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
          Your Commonbase
        </span>
        , {firstLastName.firstName}!
      </h1>
      <ForceFromEntry inputEntry={randomEntry} comments={comments} />
      <p className="my-4">{randomEntry ? randomEntry.data : 'Loading...'}</p>
      {randomEntry && (
        <>
          <button
            onClick={handleRandom}
            type="button"
            className="my-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4"
          >
            Random Entry
          </button>
          <button
            onClick={() => {
              const { id } = randomEntry;
              router.push(`/dashboard/entry/${id}`);
            }}
            type="button"
            className="my-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4"
          >
            Open Entry
          </button>
        </>
      )}
    </div>
  );
};

export default SimpleDashboard;
