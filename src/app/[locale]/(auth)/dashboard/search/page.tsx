'use client';

import { useUser } from '@clerk/nextjs';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import type { SearchClient } from 'instantsearch.js';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import {
  fetchSearchEntries,
  splitIntoWords,
  toHostname,
} from '@/helpers/functions';

const CustomSearchBox = ({ setSemanticSearchResults }: any) => {
  const { query, refine } = useSearchBox();

  return (
    <input
      id="search-input"
      onChange={(e) => {
        try {
          refine(e.target.value);
        } catch (err) {
          console.error('Error refining search:', err);
        }
        setSemanticSearchResults();
      }}
      type="text"
      style={{ fontSize: '17px' }}
      value={query}
      className="mb-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      placeholder="Search"
    />
  );
};

const CustomHit = ({ hit }: any) => {
  return (
    <div key={hit.id}>
      <div className="mx-2 mb-4 flex items-center justify-between">
        <div className="max-w-full overflow-visible whitespace-normal break-words">
          <Link
            href={{
              pathname: `/dashboard/entry/${hit.id}`,
            }}
            className="block text-gray-900 no-underline"
          >
            <div
              className="w-full max-w-full overflow-visible whitespace-normal break-words"
              style={{ maxWidth: '100%' }}
            >
              <span
                className="font-normal"
                dangerouslySetInnerHTML={{
                  __html: hit.highlightResult?.data?.value || '',
                }}
              />
            </div>
          </Link>
          {hit.highlightResult?.metadata?.author && (
            <>
              <span>Author: </span>
              <button
                type="button"
                className="font-normal text-gray-500 underline hover:text-blue-600"
                dangerouslySetInnerHTML={{
                  __html: hit.highlightResult.metadata.author.value,
                }}
                onClick={() => {
                  window.open(hit.metadata.author, '_blank');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.open(hit.metadata.author, '_blank');
                  }
                }}
                aria-label={`Open author link: ${hit.highlightResult.metadata.author.value}`}
              />
              <br />
            </>
          )}
          {hit.highlightResult?.metadata?.title && (
            <>
              <span>Title: </span>
              <span
                className="font-normal text-gray-500"
                dangerouslySetInnerHTML={{
                  __html: hit.highlightResult.metadata.title.value,
                }}
              />
            </>
          )}
        </div>
      </div>
      <hr className="my-4" />
    </div>
  );
};

const CustomHits = ({ hits }: any) => {
  const { items } = useHits(hits);

  return (
    <div>
      {items.map((item: any) => (
        <CustomHit key={item.id} hit={item} />
      ))}
    </div>
  );
};

const Search = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [firstLastName, setFirstLastName] = useState({
    firstName: '',
    lastName: '',
  });

  const { user, isLoaded } = useUser();

  const handleSearchHelper = async (entryData: string) => {
    const parsedEntries = await fetchSearchEntries(
      entryData,
      setSearchResults,
      null,
    );
    return parsedEntries;
  };

  const handleSearch = async (entryData: string, _: string) => {
    const parsedEntries = await handleSearchHelper(entryData);
    setSearchResults(parsedEntries);
  };

  const [isSearchClient, setSearchClient] = useState<SearchClient | null>(null);

  const fetchToken = async () => {
    try {
      const token = await fetch('/api/searchToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const tokenData = await token.json();

      if (tokenData.error) {
        if (tokenData.error.includes('upgrade to search or synthesis plan')) {
          return;
        }
        throw new Error(tokenData.error);
      }
      if (Object.keys(tokenData).length === 0) {
        throw new Error('No token data returned from the API');
      }

      sessionStorage.setItem(
        'meliToken',
        JSON.stringify({
          token: tokenData.token.token,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000 - 2000).toISOString(),
        }),
      );

      const { searchClient } = instantMeiliSearch(
        process.env.NEXT_PUBLIC_MEILI_HOST!,
        tokenData.token.token,
        {
          placeholderSearch: true,
        },
      );

      setSearchClient(searchClient);
    } catch (err) {
      // Handle error silently
    }
  };

  useEffect(() => {
    const initializeSearchClient = async () => {
      try {
        await fetchToken();
      } catch (error: any) {
        if (error.message.includes('Tenant token expired')) {
          console.warn('Tenant token expired, fetching a new token...');
          fetchToken();
        } else {
          console.error('Search error:', error);
        }
      }
    };

    initializeSearchClient();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (user?.firstName && user?.lastName) {
      setFirstLastName({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [isLoaded, user]);

  const renderResultData = (result: any) => {
    if (
      result &&
      result.author &&
      result.author.includes('imagedelivery.net')
    ) {
      return (
        <Image
          src={result.author}
          alt="Content"
          width={500}
          height={300}
          className="object-contain"
        />
      );
    }

    if (result && result.code) {
      return (
        <SyntaxHighlighter
          language={
            result.language === 'typescriptreact' ? 'tsx' : result.language
          }
          style={docco}
          wrapLines
          wrapLongLines
          customStyle={{ height: '200px', overflow: 'scroll' }}
        >
          {result.code}
        </SyntaxHighlighter>
      );
    }

    if (result.parentData) {
      return result.parentData.data;
    }
    if (result.data.split(' ').length > 2200) {
      return (
        <>
          {splitIntoWords(result.data, 22, 0)}...
          <span className="mt-1 block text-sm text-gray-500">
            ...{splitIntoWords(result.data, 22, 22)}...
          </span>
        </>
      );
    }
    return result.data;
  };

  const renderResultDataWMetaData = (result: any) => {
    if (
      result.metadata &&
      result.metadata.author &&
      result.metadata.author.includes('imagedelivery.net')
    ) {
      return (
        <Image
          src={result.metadata.author}
          alt="Content"
          width={500}
          height={300}
          className="object-contain"
        />
      );
    }

    if (result.metadata && result.metadata.code) {
      return (
        <SyntaxHighlighter
          language={
            result.metadata.language === 'typescriptreact'
              ? 'tsx'
              : result.metadata.language
          }
          style={docco}
          wrapLines
          wrapLongLines
          customStyle={{ height: '200px', overflow: 'scroll' }}
        >
          {result.metadata.code}
        </SyntaxHighlighter>
      );
    }

    if (result.parentData) {
      return result.parentData.data;
    }
    if (result.data.split(' ').length > 2200) {
      return (
        <>
          {splitIntoWords(result.data, 22, 0)}...
          <span className="mt-1 block text-sm text-gray-500">
            ...{splitIntoWords(result.data, 22, 22)}...
          </span>
        </>
      );
    }
    return result.data;
  };

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (searchResults.length > 0) {
      setSearchResults([]);
    }
  }, [inputValue, searchResults.length]);

  const setSemanticSearchResults = () => {
    setSearchResults([]);
  };

  return (
    <div className="mx-auto my-8 max-w-screen-md">
      {isSearchClient ? (
        <InstantSearch
          searchClient={isSearchClient}
          indexName="ycb_fts_staging"
        >
          <div className="mb-6">
            <CustomSearchBox
              setSemanticSearchResults={setSemanticSearchResults}
            />
            <div className="mt-4 flex space-x-2">
              <button
                type="button"
                className="mb-2 me-2 w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300"
                onClick={async () => {
                  const query = (
                    document.getElementById('search-input') as HTMLInputElement
                  ).value;
                  if (!query) {
                    return;
                  }
                  setIsLoading(true);
                  await handleSearch(query, '');
                  setIsLoading(false);
                }}
              >
                {isLoading ? 'Loading...' : 'Search'}
              </button>
            </div>
            {searchResults.map((result: any) => (
              <div key={result.id} className="mt-4">
                <Link
                  href={{
                    pathname: `/dashboard/entry/${result.id}`,
                  }}
                  className="block text-gray-900 no-underline"
                >
                  <div className="relative">
                    <span className="font-normal">
                      {renderResultDataWMetaData(result)}
                    </span>
                  </div>
                  <div className="ml-6 flex items-center">
                    {result.parentData ? (
                      <>
                        <div className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
                          {firstLastName.firstName && firstLastName.lastName ? (
                            <>
                              {firstLastName.firstName[0]}
                              {firstLastName.lastName[0]}
                            </>
                          ) : (
                            'yCb'
                          )}
                        </div>
                        <span className="font-normal">{result.data}</span>
                      </>
                    ) : null}
                  </div>
                </Link>
                <div className="text-sm text-gray-500">
                  Created: {new Date(result.createdAt).toLocaleString()}
                  {result.createdAt !== result.updatedAt && (
                    <>
                      {' '}
                      | Last Updated:{' '}
                      {new Date(result.updatedAt).toLocaleString()}{' '}
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-normal">
                    {Math.round(result.similarity * 100)}% similar
                  </span>
                </div>
                <a
                  target="_blank"
                  href={result.metadata.author}
                  rel="noopener noreferrer"
                  className="inline-flex items-center font-medium text-blue-600 hover:underline"
                >
                  {toHostname(result.metadata.author)}
                  <svg
                    className="ms-2.5 size-3 rtl:rotate-[270deg]"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"
                    />
                  </svg>
                </a>
              </div>
            ))}
            <CustomHits hits={searchResults} />
          </div>
        </InstantSearch>
      ) : (
        <div>
          <div className="flex flex-row items-center border border-black">
            <div className="size-full p-2">
              <input
                id="search-input"
                onChange={(e) => setInputValue(e.target.value)}
                type="text"
                style={{ fontSize: '17px' }}
                value={inputValue}
                className="h-14 w-full rounded-xl bg-slider-track p-4 shadow-slider-track-shadow"
                placeholder="Search"
              />
            </div>
            <div className="flex flex-row">
              <button
                type="button"
                className="aspect-square w-24 border-l border-black hover:bg-black hover:text-white"
                onClick={async () => {
                  const query = (
                    document.getElementById('search-input') as HTMLInputElement
                  ).value;
                  if (!query) {
                    return;
                  }
                  setIsLoading(true);
                  await handleSearch(query, '');
                  setIsLoading(false);
                }}
              >
                {isLoading ? 'Loading...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    `https://www.google.com/search?q=${inputValue}`,
                    '_blank',
                  );
                }}
                className="aspect-square w-24 border-l border-black hover:bg-black hover:text-white"
              >
                Web Search
              </button>
            </div>
          </div>
          <div>
            {searchResults.map((result) => (
              <div key={result.id}>
                <div
                  key={result.id}
                  className="mx-2 mb-4 flex items-center justify-between"
                >
                  <div className="grow">
                    <Link
                      href={{
                        pathname: `/dashboard/entry/${result.id}`,
                      }}
                      className="block text-gray-900 no-underline"
                    >
                      <div className="relative">
                        <Image
                          src={result.favicon}
                          alt="favicon"
                          width={16}
                          height={16}
                          className="float-left mr-2"
                        />
                        <span className="font-normal">
                          {renderResultData(result)}
                        </span>
                      </div>
                      <div className="ml-6 flex items-center">
                        {result.parentData ? (
                          <>
                            <div className="mr-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
                              {firstLastName.firstName &&
                              firstLastName.lastName ? (
                                <>
                                  {firstLastName.firstName[0]}
                                  {firstLastName.lastName[0]}
                                </>
                              ) : (
                                'yCb'
                              )}
                            </div>
                            <span className="font-normal">{result.data}</span>
                          </>
                        ) : null}
                      </div>
                    </Link>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(result.createdAt).toLocaleString()}
                      {result.createdAt !== result.updatedAt && (
                        <>
                          {' '}
                          | Last Updated:{' '}
                          {new Date(result.updatedAt).toLocaleString()}{' '}
                        </>
                      )}
                    </div>
                    <a
                      target="_blank"
                      href={result.metadata.author}
                      rel="noopener noreferrer"
                      className="inline-flex items-center font-medium text-blue-600 hover:underline"
                    >
                      {toHostname(result.metadata.author)}
                      <svg
                        className="ms-2.5 size-3 rtl:rotate-[270deg]"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 18"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"
                        />
                      </svg>
                    </a>
                    <button
                      type="button"
                      className="ms-2 inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-4"
                      onClick={() => {
                        setInputValue(`"metadata:${result.metadata.title}"`);
                      }}
                    >
                      Search Metadata
                    </button>
                  </div>
                </div>
                <hr className="my-4" />
              </div>
            ))}
          </div>
          {/* <div className="text-sm text-gray-500">
            <span className="font-normal">
              To get full text search on Companion, upgrade to the search or
              synthesis plan!
            </span>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Search;
