'use client';

import { useRef } from 'react';

import CreateEntryInput from './CreateEntryInput';
import RecentActivityFeed from './RecentActivityFeed';

const Dashboard = () => {
  const activityFeedRef = useRef<{ fetchLogEntries: () => void }>();

  const handleEntryAdded = () => {
    activityFeedRef.current?.fetchLogEntries();
  };

  return (
    <div className="mx-auto max-w-screen-md">
      <div className="flex w-full flex-col gap-8">
        <CreateEntryInput onEntryAdded={handleEntryAdded} />
        <RecentActivityFeed ref={activityFeedRef} />
      </div>
    </div>
  );
};

export default Dashboard;
