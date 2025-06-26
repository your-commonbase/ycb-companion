'use client';

import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnimatedNumbers from 'react-animated-numbers';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';

import { fetchFavicon } from '@/helpers/functions';

// import ForceFromEntry from "./ForceFromEntry";
// import Uploader from "./Uploader";

const SimpleDashboard = () => {
  // const [randomEntry, setRandomEntry] = useState<any>(null);
  // const [comments, setComments] = useState<any[]>([]);

  const [logEntries, setLogEntries] = useState<any[]>([]);
  // const [isSaving, setIsSaving] = useState(false);
  // const [timeMachine, setTimeMachine] = useState<any>('week');
  // const [randomTimeMachineEntry, setRandomTimeMachineEntry] =
  //   useState<any>(null);
  // const [timeMachineEntries, setTimeMachineEntries] = useState<any[]>([]);
  const [totalEntries, setTotalEntries] = useState(-1);
  const [todaysEntriesLength, setTodaysEntriesLength] = useState(0);
  const [showLogEmbed, setShowLogEmbed] = useState<Record<string, boolean>>({});

  // Dailies state
  const [todaysComments, setTodaysComments] = useState(0);
  const [showPartyAnimation, setShowPartyAnimation] = useState(false);
  // eslint-disable-next-line
  const [, setLastCompletionDate] = useState<string | null>(
    null,
  );

  // const [inboxEntries, setInboxEntries] = useState<any[]>([]);

  // const handleRandom = async () => {
  //   setRandomEntry(null);
  //   setComments([]);
  //   // fetch a random entry and open it
  //   const entry = await fetchRandomEntry();
  //   // const entry = await fetchByID('9548');
  //   // if entry has a parent_id, fetch the parent entry
  //   let { metadata } = entry;
  //   try {
  //     metadata = JSON.parse(entry.metadata);
  //   } catch (err) {
  //     console.error('Error parsing metadata:', err);
  //   }
  //   if (metadata.alias_ids) {
  //     const commentsList = [];
  //     const aliasEntries = await Promise.all(
  //       metadata.alias_ids.map(async (aliasId: string) => {
  //         const aliasEntry = await fetchByID(aliasId);
  //         return aliasEntry;
  //       }),
  //     );
  //     for (const aliasEntry of aliasEntries) {
  //       commentsList.push({
  //         aliasId: aliasEntry.id,
  //         aliasData: aliasEntry.data,
  //         aliasMetadata: aliasEntry.metadata,
  //       });
  //     }
  //     setComments(commentsList);
  //   }
  //   if (metadata.parent_id) {
  //     const parentEntry = await fetchByID(metadata.parent_id);
  //     // make sure metadata is JSON parseable
  //     try {
  //       parentEntry.metadata = JSON.parse(parentEntry.metadata);
  //     } catch (err) {
  //       // pass
  //     }

  //     if (parentEntry.metadata.alias_ids) {
  //       const commentsList = [];
  //       const aliasEntries = await Promise.all(
  //         parentEntry.metadata.alias_ids.map(async (aliasId: string) => {
  //           const aliasEntry = await fetchByID(aliasId);
  //           return aliasEntry;
  //         }),
  //       );
  //       for (const aliasEntry of aliasEntries) {
  //         commentsList.push({
  //           aliasId: aliasEntry.id,
  //           aliasData: aliasEntry.data,
  //           aliasMetadata: aliasEntry.metadata,
  //         });
  //       }
  //       setComments(commentsList);
  //     }

  //     setRandomEntry(parentEntry);
  //     return parentEntry;
  //   }
  //   try {
  //     entry.metadata = JSON.parse(entry.metadata);
  //   } catch (err) {
  //     // pass
  //   }
  //   setRandomEntry(entry);
  //   return entry;
  // };

  // for time machine, fetch entries from the past week, month, or year depending on the timeMachine state and select a random entry from the fetched entries
  /*

  const fetchRecords = useCallback(
    async (date: Date) => {
      // convert date to form 2024-01-01
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let monthString = month.toString();
      // put a 0 in front of month if it is less than 10
      if (month < 10) {
        monthString = `0${month}`;
      }
      const day = date.getDate();
      let dayString = day.toString();
      if (day < 10) {
        dayString = `0${day}`;
      }
      const dateString = `${year}-${monthString}-${dayString}`;
      setSelectedDay(dateString);
      setLoading(true);

      // run a post request to fetch records for that date at /api/daily
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: dateString }),
      });
      const responseData = await response.json();

      // console.log('Fetched records:', responseData);
      // set entries to the mapped data
      setEntries(responseData.data);
      setDateSelected(date);
      setLoading(false);
    },
    [setSelectedDay, setLoading, setEntries],
  );
  */
  // const fetchTimeMachineEntries = async () => {
  //   try {
  //     const date = new Date();
  //     switch (timeMachine) {
  //       case 'week':
  //         date.setDate(date.getDate() - 7);
  //         break;
  //       case 'month':
  //         date.setMonth(date.getMonth() - 1);
  //         break;
  //       case 'year':
  //         date.setFullYear(date.getFullYear() - 1);
  //         break;
  //       default:
  //         break;
  //     }
  //     // use daily endpoint to fetch entries from the past week, month, or year

  //     // convert date to form 2024-01-01
  //     const year = date.getFullYear();
  //     const month = date.getMonth() + 1;
  //     let monthString = month.toString();
  //     // put a 0 in front of month if it is less than 10
  //     if (month < 10) {
  //       monthString = `0${month}`;
  //     }
  //     const day = date.getDate();
  //     let dayString = day.toString();
  //     if (day < 10) {
  //       dayString = `0${day}`;
  //     }
  //     const dateString = `${year}-${monthString}-${dayString}`;

  //     const response = await fetch('/api/daily', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ date: dateString }),
  //     });
  //     const responseData = await response.json();
  //     setTimeMachineEntries(responseData.data);
  //     // math random number between 0 and the length of the responseData.data array
  //     const randomIndex = Math.floor(Math.random() * responseData.data.length);
  //     setRandomTimeMachineEntry(responseData.data[randomIndex]);
  //   } catch (error) {
  //     console.error('Error fetching time machine entries:', error);
  //   }
  // };

  // useEffect(() => {
  //   fetchTimeMachineEntries();
  // }, [timeMachine]);

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

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        if (user.access_token) {
          headers.Authorization = `Bearer ${user.access_token}`;
        }
      } catch (e) {
        console.warn('Failed to parse user cookie:', e);
      }
    }

    return headers;
  };

  const fetchTotalEntries = async () => {
    try {
      const response = await fetch('/api/count', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setTotalEntries(data.count);
    } catch (error) {
      console.error('Error fetching total entries:', error);
    }
  };

  useEffect(() => {
    fetchTotalEntries();
  }, []);

  // Fetch today's comments (entries with parent_id)
  const fetchTodaysComments = async () => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      let monthString = month.toString();
      if (month < 10) {
        monthString = `0${month}`;
      }
      const day = today.getDate();
      let dayString = day.toString();
      if (day < 10) {
        dayString = `0${day}`;
      }
      const dateString = `${year}-${monthString}-${dayString}`;

      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: dateString }),
      });
      const responseData = await response.json();

      // Count entries that have a parent_id (comments)
      const commentsToday = responseData.data.filter((entry: any) => {
        try {
          const metadata =
            typeof entry.metadata === 'string'
              ? JSON.parse(entry.metadata)
              : entry.metadata;
          return metadata.parent_id && metadata.parent_id.trim() !== '';
        } catch (e) {
          return false;
        }
      }).length;

      setTodaysComments(commentsToday);

      // Check if user completed dailies and show animation
      if (commentsToday === 3) {
        const completionKey = `dailies-completed-${dateString}`;
        const hasCompletedToday = localStorage.getItem(completionKey);

        if (!hasCompletedToday) {
          setShowPartyAnimation(true);
          localStorage.setItem(completionKey, 'true');
          setLastCompletionDate(dateString);

          // Show completion notification
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            // eslint-disable-next-line
            new Notification('🎉 Dailies Complete!', {
              body: "Amazing! You've completed your daily comments goal and made your personal library much better!",
              icon: '/favicon.ico',
              tag: 'dailies-complete',
            });
          }

          // Hide animation after 3 seconds
          setTimeout(() => {
            setShowPartyAnimation(false);
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error fetching today's comments:", error);
    }
  };

  useEffect(() => {
    fetchTodaysComments();

    // Set up interval to refresh every 5 minutes
    const interval = setInterval(fetchTodaysComments, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Push notification logic
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Test notification function for debugging
  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('Notification permission granted');
      // eslint-disable-next-line
      new Notification('Test Notification', {
        body: 'This is a test notification from YCB Dailies!',
        icon: '/favicon.ico',
        tag: 'test-notification',
      });
      console.log('Notification sent');
    } else {
      alert('Notifications not supported or permission not granted');
      console.log('Notifications not supported or permission not granted');
    }
  };

  const scheduleDailiesNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      const targetTime = new Date();
      targetTime.setHours(14, 0, 0, 0); // 2 PM
      console.log('targetTime:', targetTime);

      // If it's already past 2 PM, schedule for tomorrow
      if (now.getTime() > targetTime.getTime()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilNotification = targetTime.getTime() - now.getTime();
      console.log('timeUntilNotification:', timeUntilNotification);

      setTimeout(() => {
        // Check if user hasn't completed dailies
        if (todaysComments < 3) {
          // eslint-disable-next-line
          new Notification('YCB Daily Challenge', {
            body: `You've added ${todaysComments}/3 comments today. Keep building your knowledge base!`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'dailies-reminder',
          });
        }

        // Schedule next day's notification
        scheduleDailiesNotification();
      }, timeUntilNotification);
    }
  };

  // Initialize notifications on component mount
  useEffect(() => {
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        scheduleDailiesNotification();
      }
    };

    // Only request permission on user interaction to avoid being intrusive
    const handleFirstInteraction = () => {
      initNotifications();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [todaysComments]);

  useEffect(() => {
    const todaysEntriesLengthFn = async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      let monthString = month.toString();
      // put a 0 in front of month if it is less than 10
      if (month < 10) {
        monthString = `0${month}`;
      }
      const day = today.getDate();
      let dayString = day.toString();
      if (day < 10) {
        dayString = `0${day}`;
      }
      const dateString = `${year}-${monthString}-${dayString}`;

      // call /api/entries
      const response = await fetch('/api/daily', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: dateString }),
      });
      const responseData = await response.json();

      // console.log('Fetched records:', responseData);
      // set entries to the mapped data
      setTodaysEntriesLength(responseData.data.length);
    };

    todaysEntriesLengthFn();
  }, []);

  // get log entries
  const fetchLogEntries = async () => {
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          limit: 20,
        }),
      });
      const data = await response.json();
      // if createdAt == updatedAt, say "added", else "updated"
      const log = data.data
        .map((entry: any) => {
          if (entry.createdAt === entry.updatedAt) {
            return {
              ...entry,
              action: 'added',
            };
          }
          return {
            ...entry,
            action: 'updated',
          };
        })
        .filter((entry: any) => entry !== null);

      log.forEach((entry: any) => {
        if (entry.metadata.author.includes('youtube.com')) {
          setShowLogEmbed((prev) => ({ ...prev, [entry.id]: false }));
        } else {
          // continue
        }
      });

      setLogEntries(log);

      // add favicon to each entry
      const faviconPromises = log.map(async (entry: any) => {
        if (entry.metadata.author) {
          const favicon = await fetchFavicon(entry.metadata.author);
          return { ...entry, favicon: favicon.favicon };
        }

        return entry;
      });

      const faviconData = await Promise.all(faviconPromises);
      setLogEntries(faviconData);
    } catch (error) {
      console.error('Error fetching log entries:', error);
    }
  };

  useEffect(() => {
    fetchLogEntries();
  }, []);

  const [cdnImageUrls, setCdnImageUrls] = useState<{ [id: string]: string }>(
    {},
  );

  useEffect(() => {
    // Find all image entries that don't have a URL yet
    const imageEntries = logEntries.filter(
      (entry: any) =>
        entry.metadata.type === 'image' && !cdnImageUrls[entry.id],
    );

    if (imageEntries.length === 0) return;

    const fetchImages = async () => {
      const ids = imageEntries.map((entry: any) => entry.id);
      const cdnResp = await fetch(`/api/fetchImageByIDs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });
      const cdnData = await cdnResp.json();

      // Update state with new URLs
      setCdnImageUrls((prev) => ({
        ...prev,
        ...Object.fromEntries(
          ids.map((id: string) => [id, cdnData.data.body.urls[id] || '']),
        ),
      }));
    };

    fetchImages();
  }, [logEntries]);

  // Party animation component
  // eslint-disable-next-line
  const PartyAnimation = () => (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="animate-bounce rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mb-4 text-4xl text-green-500">✓</div>
        <div className="mb-2 text-2xl font-bold text-green-600">
          Dailies Complete!
        </div>
        <div className="text-gray-600">
          You made your personal library much better today!
        </div>
      </div>
    </div>
  );

  // Dailies progress bar component
  // eslint-disable-next-line
  const DailiesBar = () => {
    const progress = Math.min((todaysComments / 3) * 100, 100);
    const isComplete = todaysComments >= 3;

    return (
      <div className="mx-2 mb-6 rounded-lg border border-gray-200 bg-white p-4 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Daily Comments Challenge
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              {todaysComments}/3 comments
            </span>
            <button
              onClick={sendTestNotification}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
              type="button"
              title="Test notification"
            >
              Test
            </button>
          </div>
        </div>

        <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm text-gray-600">
          {isComplete ? (
            <span className="font-medium text-green-600">
              Completed! You reached your daily goal.
            </span>
          ) : (
            <span>
              Add {3 - todaysComments} more comment
              {3 - todaysComments !== 1 ? 's' : ''} to complete your daily
              challenge
            </span>
          )}
        </div>

        {todaysComments === 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Tip: Reply to your existing entries to build connections in your
            knowledge base
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-2">
      {/* Party Animation */}
      {showPartyAnimation && <PartyAnimation />}

      {/* Dailies Progress Bar */}
      <DailiesBar />

      {totalEntries >= 0 && (
        <h2 className="mx-2 mt-8 text-xl font-extrabold text-gray-400 md:text-lg lg:text-lg">
          You have{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {totalEntries}
          </span>{' '}
          total entries in your commonbase. That&apos;s the equivalent of{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {Math.round(totalEntries / 251)}
          </span>{' '}
          journals filled! You are{' '}
          <span className="bg-gradient-to-r from-sky-400 to-emerald-600 bg-clip-text text-transparent">
            {251 - (totalEntries % 251)}
          </span>{' '}
          entries away from filling your next journal!
        </h2>
      )}

      <h2 className="mx-2 mt-8 text-xl font-extrabold text-gray-400 md:text-lg lg:text-lg">
        You have{' '}
        <AnimatedNumbers
          includeComma
          transitions={(index) => ({
            type: 'spring',
            duration: index + 0.3,
          })}
          animateToNumber={todaysEntriesLength}
          fontStyle={{
            fontSize: 18,
            color: 'black',
          }}
        />
        entries today!
      </h2>

      <h1 className="my-4 text-xl font-extrabold text-gray-900 md:text-xl lg:text-xl">
        Recent Activity Log
      </h1>
      <div className="mx-2 my-4 w-full overflow-auto">
        {logEntries.map((entry: any) => (
          <div key={entry.id}>
            <div
              key={entry.id}
              className="mx-2 mb-4 flex items-center justify-between"
            >
              <div className="grow">
                <Link
                  href={{
                    pathname: `/dashboard/entry/${entry.id}`,
                  }}
                  className="block text-gray-900 no-underline"
                  prefetch={false}
                >
                  <div className="relative">
                    {entry.metadata.author &&
                      entry.metadata.author.includes('imagedelivery.net') && (
                        <img
                          src={entry.metadata.author}
                          alt="ycb-companion-image"
                        />
                      )}
                    <span className="flex items-center font-normal">
                      <img
                        src={entry.favicon || '/favicon.ico'}
                        alt="favicon"
                        className="mr-2 size-6"
                      />
                      {entry.data}
                    </span>
                  </div>
                </Link>
                <div className="text-sm text-gray-500">
                  {(() => {
                    if (entry.action === 'added') {
                      return <b>Added</b>;
                    }
                    if (entry.action === 'updated') {
                      return <b>Updated</b>;
                    }
                    return 'Deleted';
                  })()}{' '}
                  {new Date(entry.updatedAt).toLocaleDateString()}
                </div>
                {/* a button called 'show embed' that only shows if entry is a youtube video  on click display the embed */}
                {entry.metadata.author.includes('youtube.com') && (
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      onClick={() => {
                        // if entry is a youtube video, display the embed
                        console.log(`show embed for ${entry.id}`);
                        console.log(entry.metadata.author);
                        console.log(
                          entry.metadata.author.split('v=')[1]?.split('&')[0],
                        );
                        console.log(showLogEmbed);
                        setShowLogEmbed((prev) => ({
                          ...prev,
                          [entry.id]: true,
                        }));
                      }}
                    >
                      Show Embed
                    </button>

                    {showLogEmbed[entry.id] && (
                      <div className="mt-2 text-sm text-gray-500">
                        <LiteYouTubeEmbed
                          id={
                            entry.metadata.author.split('v=')[1]?.split('&')[0]
                          }
                          title="YouTube video"
                        />
                      </div>
                    )}
                  </>
                )}
                {entry.metadata.type === 'image' && cdnImageUrls[entry.id] && (
                  <img
                    src={cdnImageUrls[entry.id]}
                    alt="entry"
                    style={{ maxWidth: 200, marginTop: 8 }}
                  />
                )}
              </div>
            </div>
            {/* <hr className="my-4" /> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleDashboard;
