/* eslint-disable no-console */

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ScrollToTop from 'react-scroll-to-top';

import { getCache, invalidateCache, setCache } from '@/helpers/cache';

import Entries from './Entries';

const SearchBox = () => {
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [textAreaValue, setTextAreaValue] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [collection, setCollection] = useState<any[]>([]);
  const cache = getCache();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (textAreaRef.current) {
        const offsetTop = textAreaRef.current.getBoundingClientRect().top;
        setIsSticky(offsetTop < 9);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchByID = async (id: string) => {
    const cachedAlias = cache.aliases[id];
    if (cachedAlias) {
      // console.log('Returning cached alias:', cachedAlias);
      return { data: cachedAlias };
    }

    // TODO: this breaks w aliases updating and idk how to fix atm
    // const cachedParent = cache.parents[id];
    // if (cachedParent) {
    //   console.log('Returning cached parent:', cachedParent);
    //   return { data: cachedParent };
    // }

    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
        }),
      });
      const data = await response.json();

      const entry = data.data;
      // parse metadata
      const metadata = JSON.parse(entry.metadata);
      // cache the entry
      if (metadata.parent_id) {
        cache.aliases[id] = entry;
      } else {
        cache.parents[id] = entry;
      }

      setCache(cache);

      return data;
    } catch (error) {
      console.error('Error fetching entry by ID:', error);
      return {};
    }
  };

  const addEntry = async (data: string, metadata: string) => {
    try {
      const response = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          metadata,
        }),
      });
      const responseData = await response.json();

      console.log('Added entry:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error adding entry:', error);
      return {};
    }
  };

  // adding to a collection is the entry selected by the user, the matched alias (if there is one) and the search result. append to the collection
  const addToCollection = (entry: any, alias: any) => {
    if (!showCollection) {
      setShowCollection(true);
    }
    setCollection([...collection, { entry, alias, query: textAreaValue }]);
    console.log('Collection:', collection);
  };

  const updateEntry = async (id: string, data: string, metadata: string) => {
    try {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          data,
          metadata,
        }),
      });
      const responseData = await response.json();

      console.log('Updated entry:', responseData);
      cache.parents[id] = responseData.data;
      return responseData;
    } catch (error) {
      console.error('Error updating entry:', error);
      return {};
    }
  };

  const fetchSearchResults = async (query: string) => {
    try {
      setSearchResults([]);
      setShowLoading(true);
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });
      console.log('response:', response);
      const data = await response.json();
      console.log('Fetched search results:', data);

      // convert each metadata string to an object
      const updatedData = data.data.map((entry: any) => {
        try {
          return { ...entry, metadata: JSON.parse(entry.metadata) };
        } catch (err) {
          console.error('Error parsing metadata:', err);
          return entry;
        }
      });

      // for each entry, fetch the if metadata has a parent ID fetch the parent entry and its aliases and then fetch them
      /*
      ex: 
      {
  "title": "Your Commonbase Dashboard",
  "author": "",
  "_display": "right after chq talk kind of depressed was looking fwd to this and a bit empty now its over in terms of next goal. also afraid of medicine that i promised myself id start taking",
  "parent_id": 2575
}

  fetchByID(2575).then((parentEntry) => {
  "title": "Your Commonbase Dashboard",
  "author": "",
  "alias_ids": [
    2580
  ]
}).then((parentEntry) => {
  let aliasData = [];
  for (let i = 0; i < parentEntry.alias_ids.length; i++) {
    fetchByID(parentEntry.alias_ids[i]);
    aliasData.push(aliasData.data);
  }

  updatedMetadataWAliases = {
    ...parentEntry,
    aliasData: [...],
    selectedIndex: (index of the alias entry that was in the first step)
      */

      const updatedDataWithAliases = await Promise.all(
        updatedData.map(async (entry: any) => {
          if (entry.metadata.parent_id) {
            try {
              let selectedIndex = -1;

              // Fetch parent entry by parent_id
              const parentEntryRes = await fetchByID(entry.metadata.parent_id);
              const parentEntry = parentEntryRes.data;

              // Parse parent metadata
              let parentMetadataJSON = parentEntry.metadata;
              try {
                parentMetadataJSON = JSON.parse(parentEntry.metadata);
              } catch (err) {
                console.error('Error parsing parent metadata:', err);
              }
              parentEntry.metadata = parentMetadataJSON;

              // Find the index of the current entry in the parent's alias_ids
              if (parentMetadataJSON.alias_ids) {
                // map parent alias to numbers
                const aliasIds = parentMetadataJSON.alias_ids.map(Number);

                if (aliasIds.includes(Number(entry.id))) {
                  // console.log('aliasIds:', aliasIds);
                  // console.log('entry.id:', entry.id);
                  // console.log(
                  //   'aliasIds.indexOf(Number(entry.id)):',
                  //   aliasIds.indexOf(Number(entry.id)),
                  // );
                  selectedIndex = aliasIds.indexOf(Number(entry.id));
                }
              }

              // Fetch all alias entries by alias_ids
              const aliasData = parentMetadataJSON.alias_ids
                ? await Promise.all(
                    parentMetadataJSON.alias_ids.map(
                      async (aliasId: string) => {
                        try {
                          const aliasEntryRes = await fetchByID(aliasId);
                          const aliasEntry = aliasEntryRes.data;
                          return aliasEntry.data;
                        } catch (aliasFetchError) {
                          console.error(
                            `Error fetching alias entry with ID ${aliasId}:`,
                            aliasFetchError,
                          );
                          throw aliasFetchError;
                        }
                      },
                    ),
                  )
                : [];

              // Return the combined entry with parent and alias data
              return {
                ...parentEntry,
                aliasData,
                similarity: entry.similarity,
                selectedIndex,
              };
            } catch (parentFetchError) {
              console.error(
                `Error fetching parent entry with ID ${entry.metadata.parent_id}:`,
                parentFetchError,
              );
              throw parentFetchError;
            }
          } // else if we have an alias_ids array, fetch all the aliases
          else if (entry.metadata.alias_ids) {
            try {
              const aliasData = await Promise.all(
                entry.metadata.alias_ids.map(async (aliasId: string) => {
                  try {
                    const aliasEntryRes = await fetchByID(aliasId);
                    const aliasEntry = aliasEntryRes.data;
                    return aliasEntry.data;
                  } catch (aliasFetchError) {
                    console.error(
                      `Error fetching alias entry with ID ${aliasId}:`,
                      aliasFetchError,
                    );
                    throw aliasFetchError;
                  }
                }),
              );

              return {
                ...entry,
                aliasData,
              };
            } catch (aliasFetchError) {
              console.error(
                `Error fetching alias entries with IDs ${entry.metadata.alias_ids}:`,
                aliasFetchError,
              );
              throw aliasFetchError;
            }
          }

          return entry;
        }),
      );

      console.log('Setting search results:', updatedDataWithAliases);
      setShowLoading(false);
      setSearchResults(updatedDataWithAliases);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleDataFromEntry = (data: string) => {
    setTextAreaValue(data);
    // clear search results
    setSearchResults([]);
    fetchSearchResults(data);
  };

  const handleAliasAdd = async (data: any) => {
    try {
      // get id of the selected alias
      // fetch the entry by id
      invalidateCache(data.id, false);
      const parentEntry = await fetchByID(data.id);
      let parentAliases = parentEntry.data.metadata.alias_ids;
      try {
        parentAliases = JSON.parse(parentEntry.data.metadata).alias_ids;
      } catch (err) {
        console.error('Error parsing parent metadata:', err);
      }
      // add a new entry with the alias as data and the original entry's metadata
      // add parent_id to the metadata
      const parentId = data.id;
      const newMetadata = {
        ...data.metadata,
        parent_id: parentId,
      };
      const aliasRes = await addEntry(data.alias, newMetadata);
      const aliasId = aliasRes.respData.id;
      // update the original entry's metadata with the new alias id in the alias_ids array
      const updatedMetadata = {
        ...data.metadata,
        alias_ids: parentAliases ? [parentAliases, aliasId].flat() : [aliasId],
      };
      await updateEntry(parentId, data.data, updatedMetadata);

      return aliasRes;
    } catch (err) {
      return { error: err };
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setTextAreaValue(query);
      // fetchSearchResults(query);
    }
  }, [searchParams]);

  return (
    <div>
      <textarea
        id="message"
        ref={textAreaRef}
        rows={2}
        className={`sticky top-2 z-50 mt-4 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 ${
          isSticky ? 'opacity-50' : 'opacity-100'
        }`}
        placeholder="Your message..."
        value={textAreaValue}
        onChange={(e) => setTextAreaValue(e.target.value)}
        onFocus={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            fetchSearchResults(textAreaValue.trim());
          }
        }}
      />

      <button
        type="button"
        onClick={() => fetchSearchResults(textAreaValue.trim())}
        className="mb-2 me-2 mt-4 w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Search
      </button>

      {/* a container to hold the buttons in the same row */}
      {/* a container to hold the buttons in the same row */}
      <div className="mt-4 flex space-x-2">
        {/* a btn to take the text in textarea and search google with it in a new tab */}
        <button
          type="button"
          onClick={() => {
            window.open(
              `https://www.google.com/search?q=${textAreaValue}`,
              '_blank',
            );
          }}
          className="mb-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
        >
          Search the Web
        </button>

        {/* a btn to call /api/random and put the text in the textarea */}
        <button
          type="button"
          onClick={async () => {
            const response = await fetch('/api/random', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            console.log('Random data:', data);
            setTextAreaValue(data.data.data);
          }}
          className="mb-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
        >
          Random
        </button>
      </div>

      {/* a second row if showCollection is true one for "Download Collection" and one for "Clear Collection" */}
      {showCollection && (
        <div className="mt-4 flex space-x-2">
          <button
            type="button"
            onClick={() => {
              const element = document.createElement('a');
              const file = new Blob([JSON.stringify(collection)], {
                type: 'text/plain',
              });
              element.href = URL.createObjectURL(file);
              element.download = 'collection.json';
              document.body.appendChild(element); // Required for this to work in FireFox
              element.click();
              // clear the collection after downloading and hide the buttons
              setCollection([]);
              setShowCollection(false);
              // remove the element
              document.body.removeChild(element);
            }}
            className="mb-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            Download Collection
          </button>
          <button
            type="button"
            onClick={() => {
              setCollection([]);
              setShowCollection(false);
            }}
            className="mb-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
          >
            Clear Collection
          </button>
        </div>
      )}

      {showLoading && (
        <div className="flex justify-center">
          <div
            role="status"
            className="my-4 max-w-md animate-pulse space-y-4 divide-y divide-gray-200 rounded border border-gray-200 p-4 shadow md:p-6 dark:divide-gray-700 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div>
                <div className="mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div>
                <div className="mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div>
                <div className="mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between pt-4">
              <div>
                <div className="mb-2.5 h-2.5 w-24 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="h-2 w-32 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2.5 w-12 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}

      <Entries
        searchResults={searchResults}
        onDelve={handleDataFromEntry}
        onAddAlias={handleAliasAdd}
        onAddToCollection={addToCollection}
      />
      <ScrollToTop smooth />
    </div>
  );
};

export default SearchBox;
