'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Modal from 'react-modal';

import NavigationDropdown from '@/components/NavigationDropdown';
import SearchModalBeta from '@/components/SearchModalBeta';
// import SpeedDial from '@/components/SpeedDial';
import Uploader from '@/components/Uploader';
import UploaderModalWrapper from '@/components/UploaderModalWrapper';
import ShareUploader from '@/components/uploaders/share';
import { fetchRandomEntry } from '@/helpers/functions';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default function DashboardLayout(props: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareParam = searchParams!.get('share') || '';
  const [isSearchModalBetaOpen, setSearchModalBetaOpen] = useState(false);

  const [searchBetaModalQuery] = useState('');

  const [isFastEntryModalOpen, setFastEntryModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [uploaderModalType, setUploaderModalType] = useState('');
  const [isUploaderModalOpen, setUploaderModalOpen] = useState(false);

  // const openFastEntryModal = () => setFastEntryModalOpen(true);
  const closeFastEntryModal = () => setFastEntryModalOpen(false);

  const openSearchModalBeta = () => setSearchModalBetaOpen(true);
  const closeSearchModalBeta = () => setSearchModalBetaOpen(false);

  // const onOpenModal = (which: string) => {
  //   if (which === 'upload') {
  //     openFastEntryModal();
  //     const intervalId = setInterval(() => {
  //       const input = document.getElementById('modal-message');
  //       if (input) {
  //         setTimeout(() => {
  //           input.focus();
  //         }, 100);
  //         clearInterval(intervalId); // Stop the interval once the input is focused
  //       }
  //     }, 100);
  //   } else if (which === 'search') {
  //     openSearchModalBeta();
  //     const intervalId = setInterval(() => {
  //       const input = document.getElementById('modal-beta-search');
  //       if (input) {
  //         setTimeout(() => {
  //           input.focus();
  //         }, 100);
  //         clearInterval(intervalId); // Stop the interval once the input is focused
  //       }
  //     }, 100);
  //   }
  // };

  const closeModal = () => {
    setSearchModalBetaOpen(false);
    setUploaderModalOpen(false);
  };

  const handleRandom = useCallback(async () => {
    const entry = await fetchRandomEntry();
    router.push(`/dashboard/entry/${entry.id}`);
  }, [router]);

  // open share if ?share is in url params
  useEffect(() => {
    if (shareParam) {
      setShowShareModal(true);
    }
  }, [shareParam]);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      const target = event.target as HTMLElement;
      if (
        event.key === 'u' &&
        // meta key not pressed
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !target.tagName.toLowerCase().includes('input') &&
        !target.tagName.toLowerCase().includes('textarea')
      ) {
        // upload url
        setUploaderModalType('url');
        setUploaderModalOpen(true);
        const intervalId = setInterval(() => {
          const input = document.getElementById('modal-message-author');
          if (input) {
            setTimeout(() => {
              input.focus();
            }, 100);
            clearInterval(intervalId); // Stop the interval once the input is focused
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      const target = event.target as HTMLElement;
      if (
        event.key === 't' &&
        // meta key not pressed
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !target.tagName.toLowerCase().includes('input') &&
        !target.tagName.toLowerCase().includes('textarea')
      ) {
        // upload url
        setUploaderModalType('text');
        setUploaderModalOpen(true);
        const intervalId = setInterval(() => {
          const input = document.getElementById('modal-message');
          if (input) {
            setTimeout(() => {
              input.focus();
            }, 100);
            clearInterval(intervalId); // Stop the interval once the input is focused
          }
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      const target = event.target as HTMLElement;
      if (
        event.key === 'i' &&
        // meta key not pressed
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !target.tagName.toLowerCase().includes('input') &&
        !target.tagName.toLowerCase().includes('textarea')
      ) {
        // upload url
        setUploaderModalType('image');
        setUploaderModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // add event listener to 'r' key to open random page
  useEffect(() => {
    // const fetchRandomEntry = async () => {
    //   const response = await fetch('/api/random', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   const randdata = await response.json();
    //   return randdata.data[0];
    // };

    // const handleRandom = async () => {
    //   // fetch a random entry and open it
    //   const entry = await fetchRandomEntry();
    //   router.push(`/dashboard/entry/${entry.id}`);
    // };

    const handleKeyDown = (event: KeyboardEvent) => {
      // should be ignored if in input or textarea
      const target = event.target as HTMLElement;

      if (
        event.key === 'r' &&
        // meta key not pressed
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !target.tagName.toLowerCase().includes('input') &&
        !target.tagName.toLowerCase().includes('textarea')
      ) {
        event.preventDefault();
        handleRandom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleRandom]);

  // open search modal beta when user presses cmd+k using next/router
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.key === '/' &&
        // meta key not pressed
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !target.tagName.toLowerCase().includes('input') &&
        !target.tagName.toLowerCase().includes('textarea')
      ) {
        openSearchModalBeta();
        const intervalId = setInterval(() => {
          const input = document.getElementById('modal-beta-search');
          if (input) {
            setTimeout(() => {
              input.focus();
            }, 100);
            clearInterval(intervalId); // Stop the interval once the input is focused
          }
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // TODO: re-enable inbox count
  // const [inboxCount, setInboxCount] = useState<any>({
  //   data: {
  //     count: 0,
  //   },
  // });
  // const fetchInboxCountHelper = async () => {
  //   const inboxCountResponse = await fetch('/api/inboxCount', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
  //   const inboxCountData = await inboxCountResponse.json();
  //   console.log('Inbox count:', inboxCountData);
  //   setInboxCount({
  //     data: {
  //       count: inboxCountData.data,
  //     },
  //   });
  // };

  // useEffect(() => {
  //   const fetchInboxCount = async () => {
  //     try {
  //       await fetchInboxCountHelper();
  //     } catch (error) {
  //       console.error('Error fetching inbox count:', error);
  //     }
  //   };

  //   fetchInboxCount();
  // }, []);

  return (
    <BaseTemplate
      leftNav={
        <>
          <li>
            <button
              // eslint-disable-next-line
              onClick={() => (window.location.href = '/dashboard/')}
              className="cursor-pointer border-none bg-transparent text-gray-700 hover:text-gray-900"
              type="button"
            >
              {t('dashboard_link')}
            </button>
          </li>
          <NavigationDropdown
            title="Store"
            icon={
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            }
            items={[
              {
                label: 'Text',
                shortcut: 't',
                icon: '📝',
                onClick: () => {
                  setUploaderModalType('text');
                  setUploaderModalOpen(true);
                  const intervalId = setInterval(() => {
                    const input = document.getElementById('modal-message');
                    if (input) {
                      setTimeout(() => {
                        input.focus();
                      }, 100);
                      clearInterval(intervalId);
                    }
                  }, 100);
                },
              },
              {
                label: 'URL',
                shortcut: 'u',
                icon: '🔗',
                onClick: () => {
                  setUploaderModalType('url');
                  setUploaderModalOpen(true);
                  const intervalId = setInterval(() => {
                    const input = document.getElementById(
                      'modal-message-author',
                    );
                    if (input) {
                      setTimeout(() => {
                        input.focus();
                      }, 100);
                      clearInterval(intervalId);
                    }
                  }, 100);
                },
              },
              {
                label: 'Image',
                shortcut: 'i',
                icon: '🖼️',
                onClick: () => {
                  setUploaderModalType('image');
                  setUploaderModalOpen(true);
                },
              },
              {
                label: 'Roadmap',
                icon: '',
                onClick: () => {
                  window.open(
                    'https://denim-prince-fcc.notion.site/Public-Roadmap-1f334f25fe4b807689b4f0c71056527a?pvs=4',
                    '_blank',
                  );
                },
              },
            ]}
          />
          <NavigationDropdown
            title="Search"
            icon={
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            items={[
              {
                label: 'Calendar',
                icon: '📅',
                onClick: () => router.push('/dashboard/garden/'),
              },
              {
                label: 'Gallery',
                icon: '🖼️',
                onClick: () => router.push('/dashboard/gallery/'),
              },
              {
                label: 'Random',
                shortcut: 'r',
                icon: '🎲',
                onClick: () => handleRandom(),
              },
              {
                label: 'Search',
                shortcut: '/',
                icon: '🔍',
                onClick: () => {
                  openSearchModalBeta();
                  const intervalId = setInterval(() => {
                    const input = document.getElementById('modal-beta-search');
                    if (input) {
                      setTimeout(() => {
                        input.focus();
                      }, 100);
                      clearInterval(intervalId);
                    }
                  }, 100);
                },
              },
              {
                label: 'Roadmap',
                icon: '🗺️',
                onClick: () => {
                  window.open(
                    'https://denim-prince-fcc.notion.site/Public-Roadmap-1f334f25fe4b807689b4f0c71056527a?pvs=4',
                    '_blank',
                  );
                },
              },
            ]}
          />
          <NavigationDropdown
            title="Synthesize"
            icon={
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
            items={[
              {
                label: 'Feed',
                icon: '📰',
                onClick: () => router.push('/dashboard/feed/'),
              },
              {
                label: 'Canvas',
                icon: '🖌️',
                onClick: () => router.push('/dashboard/canvas/'),
              },
              {
                label: 'Kanban',
                icon: '📋',
                onClick: () => router.push('/dashboard/kanban/'),
              },
              {
                label: 'Games',
                icon: '🔮',
                disabled: true,
                onClick: () => {},
              },
              {
                label: 'Connections',
                icon: '🔗',
                disabled: true,
                onClick: () => {},
              },
              {
                label: 'Roadmap',
                icon: '🗺️',
                onClick: () => {
                  window.open(
                    'https://denim-prince-fcc.notion.site/Public-Roadmap-1f334f25fe4b807689b4f0c71056527a?pvs=4',
                    '_blank',
                  );
                },
              },
            ]}
          />
          <NavigationDropdown
            title="Share"
            icon={
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
            }
            items={[
              {
                label: 'Share Commonbase',
                icon: '🚀',
                onClick: () => {
                  window.open('https://www.sharecommonbase.com/', '_blank');
                },
              },
              {
                label: 'Copy Current URL',
                icon: '📋',
                onClick: () => {
                  navigator.clipboard.writeText(window.location.href);
                },
              },
              {
                label: 'Export Data',
                icon: '📤',
                disabled: true,
                onClick: () => {},
              },
              {
                label: 'Roadmap',
                icon: '🗺️',
                onClick: () => {
                  window.open(
                    'https://denim-prince-fcc.notion.site/Public-Roadmap-1f334f25fe4b807689b4f0c71056527a?pvs=4',
                    '_blank',
                  );
                },
              },
            ]}
          />
          {/* <li className="border-none text-gray-700 hover:text-gray-900">
            <Link href="/dashboard/flow/" className="border-none">
              {t('flow_link')}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/starred-entries/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('starred_entries_link')}
            </Link>
          </li> */}
          {/* <li>
            <Link
              href="/dashboard/flow-sessions/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('flow_sessions_link')}
            </Link>
          </li>
          <li className="border-none text-gray-700 hover:text-gray-900">
            <Link href="/dashboard/inbox/" className="border-none">
              {t('inbox_link')}
            </Link>
            <span> ({inboxCount.data.count})</span>
          </li> */}
          {/* <li>
            <Link
              href="/dashboard/garden/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('garden_link')}
            </Link>
          </li> */}
          {/* <li>
            <Link
              href="/dashboard/grid/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('grid_link')}
            </Link>
          </li> */}
          {/* <li>
            <Link
              href="/dashboard/user-profile/"
              className="border-none text-gray-700 hover:text-gray-900"
            >
              {t('user_profile_link')}
            </Link>
          </li> */}
        </>
      }
      rightNav={
        <li>
          <Link
            href="/dashboard/settings/"
            className="border-none text-gray-700 hover:text-gray-900"
          >
            Settings
          </Link>
        </li>
      }
    >
      <SearchModalBeta
        isOpen={isSearchModalBetaOpen || false}
        closeModalFn={closeSearchModalBeta}
        inputQuery={searchBetaModalQuery}
      />
      <UploaderModalWrapper
        isOpen={isUploaderModalOpen || false}
        type={uploaderModalType}
        closeModalFn={() => closeModal()}
      />
      <Modal
        isOpen={isFastEntryModalOpen}
        onRequestClose={closeFastEntryModal}
        contentLabel="Fast Entry Modal"
        ariaHideApp={false}
        // apply custom styles using tailwind classes
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm
        -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg"
      >
        <button onClick={closeFastEntryModal} type="button">
          (close)
        </button>
        <h2
          className="mb-4 text-2xl font-semibold text-gray-800"
          id="modal-title"
        >
          Fast Entry
        </h2>
        <Uploader
          closeModal={closeFastEntryModal}
          textDefault=""
          titleDefault=""
          authorDefault="https://yourcommonbase.com/dashboard"
        />
      </Modal>
      {showShareModal && (
        <Modal
          isOpen={showShareModal}
          onRequestClose={() => setShowShareModal(false)}
          contentLabel="Share Modal"
          ariaHideApp={false}
          // apply custom styles using tailwind classes
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm
        -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg"
        >
          <button onClick={() => setShowShareModal(false)} type="button">
            (close)
          </button>
          <h2
            className="mb-4 text-2xl font-semibold text-gray-800"
            id="modal-title"
          >
            Share
          </h2>
          <ShareUploader
            closeModal={closeFastEntryModal}
            textDefault={shareParam}
            titleDefault=""
            authorDefault="https://yourcommonbase.com/dashboard"
          />
        </Modal>
      )}
      {/* <SpeedDial onOpenModal={onOpenModal} openRandom={handleRandom} /> */}
      {props.children}
    </BaseTemplate>
  );
}

export const dynamic = 'force-dynamic';
