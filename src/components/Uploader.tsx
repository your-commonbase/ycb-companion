/* eslint-disable react/no-array-index-key */

'use client';

// import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const [title, setTitle] = useState(titleDefault || '');
  const [author, setAuthor] = useState(
    authorDefault || 'https://yourcommonbase.com/dashboard',
  );
  // const [firstLastName, setFirstLastName] = useState({
  //   firstName: '',
  //   lastName: '',
  // });

  const apiKey = process.env.NEXT_PUBLIC_API_KEY_CF_IMG;
  const [loading, setLoading] = useState(false);
  const [shareYCBLoadingPct, setShareYCBLoadingPct] = useState(0);
  const [shareYCBInput, setShareYCBInput] = useState('');
  const [showShareYCBTextarea, setShowShareYCBTextarea] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // useEffect(() => {
  //   if (!isLoaded) return;
  //   // set first name as title
  //   if (user?.firstName && user?.lastName) {
  //     setTitle(`${user.firstName} ${user.lastName}`);
  //     setFirstLastName({
  //       firstName: user.firstName,
  //       lastName: user.lastName,
  //     });
  //   }
  // }, [isLoaded, user]);

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

    const metadata: Record<string, string> = {};
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

    return responseData;
  };

  const uploadFromShareYCB = async (id: string) => {
    setShareYCBLoadingPct(1);

    // Decode the base64 string
    const decoded = atob(id); // { ids: string[], from: string }
    const json = JSON.parse(decoded);
    const { ids } = json;
    let lastEntryId = '';

    const processId = async (pid: string) => {
      const response = await fetch(
        `https://share-ycbs.onrender.com/api/get-upload?id=${pid}`,
      );
      const respData = await response.json();
      if (respData.error) {
        throw new Error(respData.error);
      }
      const { data } = respData;

      const entryBody: { data: any; metadata: any; createdAt?: string } = {
        data: data.json.entry.data,
        metadata: {
          ...data.json.entry.metadata,
          title: `${data.json.entry.metadata.title} (from ycb/${data.creator})`,
        },
      };

      if (data.force_created_at) {
        entryBody.createdAt = data.created_at;
      }

      const yresponse = await fetch('/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryBody),
      });
      const addrData = await yresponse.json();
      const parentId = addrData.respData.id;
      lastEntryId = addrData.respData.id;

      const aliasIDs = [];
      for await (const comment of data.json.comments) {
        const commentBody: { data: any; metadata: any; createdAt?: string } = {
          data: comment.data,
          metadata: {
            ...comment.metadata,
            title: `${comment.metadata.title} (from ycb/${data.creator})`,
            parent_id: parentId,
          },
        };

        if (data.force_created_at) {
          commentBody.createdAt = data.force_created_at;
        }
        const cresponse = await fetch('/api/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commentBody),
        });
        const caddrData = await cresponse.json();
        aliasIDs.push(caddrData.respData.id);
      }

      if (aliasIDs.length > 0) {
        await fetch('/api/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: addrData.respData.id,
            data: data.json.entry.data,
            metadata: {
              ...data.json.entry.metadata,
              title: `${data.json.entry.metadata.title} (from ycb/${data.creator})`,
              alias_ids: aliasIDs,
            },
          }),
        });
      }
    };

    let count = 0;
    for await (const pid of ids) {
      await processId(pid);
      setShareYCBLoadingPct(Math.round(((count + 1) / ids.length) * 100));
      count += 1;
    }

    setShareYCBLoadingPct(100);
    return lastEntryId;
  };

  const uploadImage = async () => {
    const fileInput = document.getElementById('file-input-modal');
    if (!fileInput) return;
    (fileInput as HTMLInputElement).click();

    fileInput.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        setLoading(true);

        const worker = new Worker('/imageWorker.js');
        worker.postMessage({ file: arrayBuffer, apiKey });

        worker.onmessage = async (e) => {
          const { success, data, error } = e.data;
          if (success) {
            const responseEntry = await add(data.data, {
              author: data.metadata.imageUrl,
              title: 'Image',
            });
            if (responseEntry.respData) {
              router.push(`/dashboard/entry/${responseEntry.respData.id}`);
              closeModal();
            }
          } else {
            console.error('Error:', error);
          }
          setLoading(false);
        };
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="[&_p]:my-6">
      {/* an input field for your name and then a textarea and a button to submit to /api/add */}

      <textarea
        id="modal-message"
        rows={4}
        style={{ fontSize: '17px' }}
        className="mt-4 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        placeholder="What are you thinking about right now?..."
        value={textAreaValue}
        // onKeyDown={(e) => {
        //   if (e.key === 'Enter' && e.metaKey) {
        //     add(textAreaValue, {
        //       author,
        //       title,
        //     });
        //   }
        // }}
        onChange={(e) => setTextAreaValue(e.target.value)}
      />
      <button
        type="button"
        className="ml-2 mt-2 inline-block w-1/4 rounded-lg bg-gray-300 px-3 py-1 text-sm font-medium text-gray-900 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
        onClick={async () => {
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
            // comes in as readableStream read the body
            const data = await response.json();
            if (data.title) {
              setTitle(data.title);
            }
          } catch (error) {
            console.error('Error fetching title:', error);
          }
        }}
      >
        Generate Title
      </button>
      <input
        type="text"
        style={{ fontSize: '17px' }}
        className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        placeholder="Title your entry..."
        onChange={(e) => setTitle(e.target.value)}
        // onKeyDown={(e) => {
        //   if (e.key === 'Enter' && e.metaKey) {
        //     add(textAreaValue, { author, title });
        //   }
        // }}
        value={title}
      />
      <div className="flex w-full">
        <input
          type="text"
          style={{ fontSize: '17px' }}
          id="modal-message-author"
          className="mt-2 block grow rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
          placeholder="A URL for your entry..."
          onChange={(e) => setAuthor(e.target.value)}
          // onKeyDown={async (e) => {
          //   if (e.key === 'Enter' && e.metaKey) {
          //     const responseEntry = await add(textAreaValue, { author, title });
          //     console.log('responseEntry:', responseEntry);
          //     if (responseEntry.respData) {
          //       router.push(`/dashboard/entry/${responseEntry.respData.id}`);
          //       closeModal();
          //     }
          //   }
          // }}
          value={author}
        />
        <button
          type="button"
          className="ml-2 mt-2 inline-block w-1/4 rounded-lg bg-gray-300 px-3 py-1 text-sm font-medium text-gray-900 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          onClick={async () => {
            try {
              const response = await fetch(`/api/get-title?url=${author}`);
              const data = await response.json();
              if (data.title) {
                setTextAreaValue(
                  data.description
                    ? `${data.description} | ${data.title}`
                    : data.title,
                );
                setTitle(data.title);
              }
            } catch (error) {
              console.error('Error fetching title:', error);
            }
          }}
        >
          Get Title
        </button>
      </div>
      <button
        type="button"
        className="mt-2 block w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={async () => {
          if (textAreaValue.trim() === '') {
            setShowError(true);
            setErrorMessage('Please enter some text for your entry.');
            return;
          }
          if (title.trim() === '') {
            setShowError(true);
            setErrorMessage('Please enter a title for your entry.');
            return;
          }
          if (author.trim() === '') {
            setShowError(true);
            setErrorMessage('Please enter a URL for your entry.');
            return;
          }
          const responseEntry = await add(textAreaValue, { author, title });
          if (responseEntry.respData) {
            router.push(`/dashboard/entry/${responseEntry.respData.id}`);
            closeModal();
          }
        }}
      >
        Add Entry
      </button>
      <div className="inline-flex w-full items-center justify-center">
        <hr className="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white">
          or
        </span>
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="file-input-modal"
      />
      <button
        type="button"
        onClick={uploadImage}
        className="mt-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        I want to upload an image
      </button>
      <div className="inline-flex w-full items-center justify-center">
        <hr className="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white">
          or
        </span>
      </div>
      {/* <input type="file" className="hidden" id="file-input-audio" />
      <button
        type="button"
        onClick={uploadAudio}
        className="mt-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        Upload Audio -- not a worker like image, leave modal open while
        loading!!
      </button>
      <div className="inline-flex w-full items-center justify-center">
        <hr className="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white">
          or
        </span>
      </div> */}
      <button
        type="button"
        className="mt-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={() => setShowShareYCBTextarea(true)}
      >
        I have an ID from ShareYCB
      </button>

      {showShareYCBTextarea && (
        <div className="mt-2">
          <textarea
            rows={4}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            style={{ fontSize: '17px' }}
            placeholder="eyJpZHMiOlsxNiwxNSwxNCwxMywxMiwxMCw5LDhdLCJmcm9tIjoiYnJhbSJ9"
            value={shareYCBInput}
            onChange={(e) => setShareYCBInput(e.target.value)}
          />
          <button
            type="button"
            className="mt-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
            onClick={async () => {
              if (shareYCBInput) {
                setLoading(true);
                const lastID = await uploadFromShareYCB(shareYCBInput);
                setLoading(false);
                setShareYCBLoadingPct(0);
                router.push(`/dashboard/entry/${lastID}`);
                setShowShareYCBTextarea(false);
              }
            }}
          >
            Submit
          </button>
          {showError && (
            <div className="text-red-500">
              {errorMessage}
              <br />
              Please try again.
            </div>
          )}
        </div>
      )}
      {/* <button
        type="button"
        className="mt-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        onClick={async () => {
          const url = prompt('Enter the URL of the entry you want to upload');
          if (url) {
            setLoading(true);
            await uploadFromShareYCB(url);
            // console.log('responseEntry:', responseEntry);
            // if (responseEntry.respData) {
            //   router.push(`/dashboard/entry/${responseEntry.respData.id}`);
            //   closeModal();
            // }
            setLoading(false);
            setShareYCBLoadingPct(0);
            // redirect to dashboard
            router.push(`/dashboard`);
          }
        }}
      >
        Upload from Share yCb
      </button> */}
      {loading && <p>Loading...</p>}
      {shareYCBLoadingPct !== 0 && (
        <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2.5 rounded-full bg-blue-600"
            style={{ width: `${shareYCBLoadingPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Uploader;
