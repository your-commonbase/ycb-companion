'use client';

import CreateEntryInput from "./CreateEntryInput";
import RecentActivityFeed from "./RecentActivityFeed";
import { useRef } from "react";

const Dashboard = () => {
  const activityFeedRef = useRef<{ fetchLogEntries: () => void }>();

  const handleEntryAdded = () => {
    activityFeedRef.current?.fetchLogEntries();
  };

  return (
    <div className="mx-auto max-w-screen-md">
  <div className="w-full flex flex-col gap-8">
      <CreateEntryInput onEntryAdded={handleEntryAdded} />
      <RecentActivityFeed ref={activityFeedRef} />
    </div></div>);
};

export default Dashboard;
