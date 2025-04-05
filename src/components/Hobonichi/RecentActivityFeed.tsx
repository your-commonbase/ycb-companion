'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const RecentActivityFeed = () => {
  const [logEntries, setLogEntries] = useState<any[]>([]);

  const fetchLogEntries = async () => {
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 20,
        }),
      });
      const data = await response.json();
      
      // Filter out entries with parent_id and add action type
      const log = data.data
        .map((entry: any) => {
          if (entry.metadata.parent_id) {
            return null;
          }
          return {
            ...entry,
            action: entry.createdAt === entry.updatedAt ? 'added' : 'updated',
          };
        })
        .filter((entry: any) => entry !== null);

      setLogEntries(log);
    } catch (error) {
      console.error('Error fetching log entries:', error);
    }
  };

  useEffect(() => {
    fetchLogEntries();
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-xl font-bold">Recent Activity Log</h1>
      <div className="flex flex-col gap-4">
        {logEntries.map((entry: any) => (
          <Link key={entry.id} href={`/dashboard/entry/${entry.id}`} className="text-gray-900 hover:text-gray-700">
            <div className="flex flex-col gap-1 border border-black p-4">
              <div>{entry.data}</div>
              <div className="text-sm text-gray-500">
                <span className="font-medium">{entry.action === 'added' ? 'Added' : 'Updated'}</span>
                {' '}
                {new Date(entry.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentActivityFeed;