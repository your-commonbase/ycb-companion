/* eslint-disable react/no-array-index-key */

'use client';

// import { useUser } from '@clerk/nextjs';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UploaderProps {
  closeModal: () => void;
  textDefault: string;
  titleDefault: string;
  authorDefault: string;
}

const Uploader = ({
  closeModal,
  textDefault,
  titleDefault,
  authorDefault,
}: UploaderProps) => {
  // const { user, isLoaded } = useUser();
  const router = useRouter();
  const [textAreaValue, setTextAreaValue] = useState(textDefault || '');
  const [title, setTitle] = useState(titleDefault || 'Thought');
  const [author] = useState(
    authorDefault || 'https://yourcommonbase.com/dashboard',
  );

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(true); // New state for checkbox
  const [userPlan, setUserPlan] = useState<any>(null);

  useEffect(() => {
    // get plan from cookies
    const plan = Cookies.get('plan');
    console.log('plan:', plan);
    if (plan) {
      setUserPlan(plan.replace(/"/g, ''));
    }
  }, []);

  const add = async (
    data: string,
    argMetadata: Record<string, string> = {
      author: '',
      title: '',
    },
  ) => {
    // get value from input fields and add to metadata
    // set to loading
    setLoading(true);
    // const metadata = {
    //   author,
    //   title,
    // };

    try {
      const metadata: Record<string, string> = {};
      console.log('argMetadata:', argMetadata);
      for (const field of Object.keys(argMetadata)) {
        if (argMetadata[field] !== undefined) {
          metadata[field] = argMetadata[field]!;
        }
      }

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

      if (responseData.error) {
        throw new Error(responseData.error);
      }

      return responseData;
    } catch (err: any) {
      setErrorMessage(err.message);
      setShowError(true);
      setLoading(false);
      throw new Error(err.message);
    }
  };

  return (
    <div className="[&_p]:my-6">
      <textarea
        id="modal-message"
        rows={4}
        style={{ fontSize: '17px' }}
        className="mt-4 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        placeholder="What are you thinking about right now?..."
        value={textAreaValue}
        onChange={(e) => setTextAreaValue(e.target.value)}
      />
      {userPlan === 'synthesis' ? (
        <>
          <input
            type="checkbox"
            id="auto-generate-title"
            checked={autoGenerateTitle}
            onChange={() => setAutoGenerateTitle(!autoGenerateTitle)}
            className="ml-2 mt-2"
          />

          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label
            className="ml-2 text-sm font-medium text-gray-900"
            htmlFor="auto-generate-title"
          >
            Auto-generate title
          </label>

          {!autoGenerateTitle && (
            <input
              type="text"
              style={{ fontSize: '17px' }}
              className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
              placeholder="Title your entry..."
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          )}
        </>
      ) : (
        <>
          <input
            type="text"
            style={{ fontSize: '17px' }}
            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            placeholder="Title your entry..."
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />

          <span className="text-sm text-gray-500">
            To get auto generated titles, upgrade to the synthesis plan!
          </span>
        </>
      )}

      <button
        type="button"
        className="mt-2 block w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={async () => {
          if (textAreaValue.trim() === '') {
            setShowError(true);
            setErrorMessage('Please enter some text for your entry.');
            return;
          }
          if (!autoGenerateTitle && title.trim() === '') {
            setShowError(true);
            setErrorMessage(
              'Please enter a title for your entry or auto generate it.',
            );
            return;
          }
          if (author.trim() === '') {
            setShowError(true);
            setErrorMessage('Please enter a URL for your entry.');
            return;
          }

          let submittedTitle = title;

          if (autoGenerateTitle) {
            try {
              const response = await fetch(`/api/generateTitle`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  prompt: textAreaValue,
                }),
              });
              const data = await response.json();
              if (data.title) {
                setTitle(data.title);
                submittedTitle = data.title;
              }
            } catch (error) {
              console.error('Error fetching title:', error);
            }
          }

          try {
            const responseEntry = await add(textAreaValue, {
              author,
              title: submittedTitle,
            });
            if (responseEntry.respData) {
              router.push(`/dashboard/entry/${responseEntry.respData.id}`);
              closeModal();
            }
          } catch (err: any) {
            console.error('Error adding entry:', err);
          }
        }}
      >
        Add Entry
      </button>
      {loading && <p>Loading...</p>}
      {showError ? <p className="text-red-500">{errorMessage}</p> : null}
    </div>
  );
};

export default Uploader;
