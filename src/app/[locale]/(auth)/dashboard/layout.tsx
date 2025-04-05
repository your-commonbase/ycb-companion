'use client';

import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import Modal from 'react-modal';

import LocaleSwitcher from '@/components/LocaleSwitcher';
import { LogOutButton } from '@/components/LogOutButton';
import SearchModalBeta from '@/components/SearchModalBeta';
import SpeedDial from '@/components/SpeedDial';
import Uploader from '@/components/Uploader';
import UploaderModalWrapper from '@/components/UploaderModalWrapper';
import ShareUploader from '@/components/uploaders/share';
import { fetchRandomEntry } from '@/helpers/functions';
import { BaseTemplate } from '@/templates/BaseTemplate';

export default function DashboardLayout(props: { children: React.ReactNode }) {
  const t = useTranslations('DashboardLayout');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shareParam = searchParams!.get('share') || '';
  const [isSearchModalBetaOpen, setSearchModalBetaOpen] = useState(false);

  const [searchBetaModalQuery] = useState('');

  const [isFastEntryModalOpen, setFastEntryModalOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [uploaderModalType, setUploaderModalType] = useState('');
  const [isUploaderModalOpen, setUploaderModalOpen] = useState(false);

  const openFastEntryModal = () => setFastEntryModalOpen(true);
  const closeFastEntryModal = () => setFastEntryModalOpen(false);

  const openSearchModalBeta = () => setSearchModalBetaOpen(true);
  const closeSearchModalBeta = () => setSearchModalBetaOpen(false);

  const onOpenModal = (which: string) => {
    if (which === 'upload') {
      openFastEntryModal();
      const intervalId = setInterval(() => {
        const input = document.getElementById('modal-message');
        if (input) {
          setTimeout(() => {
            input.focus();
          }, 100);
          clearInterval(intervalId); // Stop the interval once the input is focused
        }
      }, 100);
    } else if (which === 'search') {
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

  // add event listener to 'r' key to open random page
  useEffect(() => {
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

  return (
    <BaseTemplate
      leftNav={
        <>
          <li>
            <Link
              href="/dashboard/"
              className={pathname === '/dashboard' ? 'nav-button-selected' : 'nav-button-unselected'}
            >
              {t('dashboard_link')}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/garden/"
              className={pathname === '/dashboard/garden' ? 'nav-button-selected' : 'nav-button-unselected'}
            >
              {t('garden_link')}
            </Link>
          </li>
        </>
      }
      rightNav={
        <>
          <li>
            <LogOutButton />
          </li>

          <li>
            <LocaleSwitcher />
          </li>
        </>
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
      <SpeedDial onOpenModal={onOpenModal} openRandom={handleRandom} />
      {props.children}
    </BaseTemplate>
  );
}

export const dynamic = 'force-dynamic';
