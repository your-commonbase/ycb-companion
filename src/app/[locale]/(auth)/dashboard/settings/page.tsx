'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { useAutoScrollMode } from '@/hooks/useAutoScrollMode';

function DownloadCSVButton() {
  const handleDownload = async () => {
    try {
      const res = await fetch('/api/download', {
        method: 'GET',
      });

      if (!res.ok) {
        console.error('failed to download:', res.status);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'commonbase.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('download error:', err);
    }
  };

  return (
    <button
      onClick={handleDownload}
      type="button"
      className="rounded bg-blue-600 p-2 text-white"
    >
      Download CSV
    </button>
  );
}

export default function SettingsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [plan, setPlan] = useState<string>('');
  const [monthlyTextEntries, setMonthlyTextEntries] = useState<number>(0);
  const [monthlyImageEntries, setMonthlyImageEntries] = useState<number>(0);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [syncingPlan, setSyncingPlan] = useState(false);
  const [planChangeStatus, setPlanChangeStatus] = useState<string>('');
  const [planStatus, setPlanStatus] = useState<any>(null);
  const [loadingPlanStatus, setLoadingPlanStatus] = useState(false);
  const { autoScrollMode, maxDepth, toggleAutoScrollMode, updateMaxDepth } =
    useAutoScrollMode();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }

  async function uploadProfilePicture(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const res = await fetch('/api/setProfilePicture', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      setResult(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const getPlan = async () => {
    const res = await fetch('/api/getPlan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    console.log('data:', data);
    return data.data;
  };

  const getMonthlyTextEntries = async () => {
    const res = await fetch('/api/getMonthlyTextEntries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    console.log('data:', data);
    return data.data;
  };

  const fetchPlanStatus = async () => {
    setLoadingPlanStatus(true);
    try {
      const res = await fetch('/api/planStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch plan status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Plan status response:', data);
      setPlanStatus(data);
    } catch (error) {
      console.error('Error fetching plan status:', error);
    } finally {
      setLoadingPlanStatus(false);
    }
  };

  const changePlan = async (newPlan: string) => {
    setChangingPlan(newPlan);
    try {
      const res = await fetch('/api/changePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (!res.ok) {
        throw new Error(`Failed to change plan: ${res.status}`);
      }

      const data = await res.json();

      if (data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
        return;
      }

      console.log('Plan change response:', data);

      // Refresh the current plan and plan status
      const updatedPlan = await getPlan();
      const updatedEntries = await getMonthlyTextEntries();
      setPlan(updatedPlan.plan);
      setMonthlyTextEntries(updatedEntries.monthlyStoreEntries.text);
      setMonthlyImageEntries(updatedEntries.monthlyStoreEntries.images || 0);
      await fetchPlanStatus();
      setPlanChangeStatus(`Successfully changed to ${newPlan} plan!`);

      // Clear status after 3 seconds
      setTimeout(() => setPlanChangeStatus(''), 3000);
    } catch (error) {
      console.error('Error changing plan:', error);
      setPlanChangeStatus('Failed to change plan. Please try again.');
      setTimeout(() => setPlanChangeStatus(''), 3000);
    } finally {
      setChangingPlan(null);
    }
  };

  const syncPlan = async () => {
    setSyncingPlan(true);
    try {
      const res = await fetch('/api/syncPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to sync plan: ${res.status}`);
      }

      const data = await res.json();
      console.log('Plan sync response:', data);

      // Refresh the current plan and plan status
      const updatedPlan = await getPlan();
      const updatedEntries = await getMonthlyTextEntries();
      setPlan(updatedPlan.plan);
      setMonthlyTextEntries(updatedEntries.monthlyStoreEntries.text);
      setMonthlyImageEntries(updatedEntries.monthlyStoreEntries.images || 0);
      await fetchPlanStatus();
    } catch (error) {
      console.error('Error syncing plan:', error);
      // TODO: Add user-facing error message
    } finally {
      setSyncingPlan(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPlan = await getPlan();
        const resMonthlyTextEntries = await getMonthlyTextEntries();

        console.log('plan:', resPlan.plan);
        console.log(
          'monthlyTextEntries:',
          resMonthlyTextEntries.monthlyStoreEntries.text,
        );
        console.log(
          'monthlyImageEntries:',
          resMonthlyTextEntries.monthlyStoreEntries.images,
        );
        setPlan(resPlan.plan);
        setMonthlyTextEntries(resMonthlyTextEntries.monthlyStoreEntries.text);
        setMonthlyImageEntries(
          resMonthlyTextEntries.monthlyStoreEntries.images || 0,
        );

        // Fetch plan status
        await fetchPlanStatus();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <h1>Settings</h1>
      <h2>Upload profile picture</h2>
      <form
        onSubmit={uploadProfilePicture}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {preview && (
          <img src={preview} alt="preview" style={{ maxWidth: '200px' }} />
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading}>
          {loading ? 'uploading...' : 'upload image'}
        </button>
        {result && <p>Refresh the page to see the uploaded image.</p>}
      </form>

      {/* Auto-Scroll Mode Setting */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Thread Settings</h2>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Auto-Scroll Mode
            </h3>
            <p className="text-sm text-gray-600">
              Automatically expand all relationships (comments, parents,
              neighbors) for thread entries as you scroll past them.
            </p>
          </div>
          <div className="ml-4">
            <label
              htmlFor="autoScrollMode"
              className="relative inline-flex cursor-pointer items-center"
            >
              <input
                id="autoScrollMode"
                type="checkbox"
                checked={autoScrollMode}
                onChange={(e) => toggleAutoScrollMode(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300" />
              <span className="ml-3 text-sm font-medium text-gray-900">
                {autoScrollMode ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
        {autoScrollMode && (
          <div className="mt-3 space-y-4">
            <div className="rounded-md bg-blue-50 p-3">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="size-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1 md:flex md:justify-between">
                  <p className="text-sm text-blue-700">
                    Auto-scroll mode will automatically expand related content
                    as you scroll through threads, creating an infinite browsing
                    experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Max Depth Setting */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-base font-medium text-gray-900">
                    Maximum Depth
                  </h4>
                  <p className="text-sm text-gray-600">
                    Maximum depth to explore before moving to other branches
                    (1-20)
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxDepth}
                    onChange={(e) =>
                      updateMaxDepth(parseInt(e.target.value, 10))
                    }
                    className="w-16 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-4 text-2xl font-bold">Tiers</h2>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-2 text-lg">Current Tier: {plan}</p>
          <p className="text-lg">
            Usage: {monthlyTextEntries} text entries / 3000 total
          </p>
          <p className="text-lg">
            Images: {monthlyImageEntries} image entries / 300 total
          </p>
          {planStatus && (
            <div className="mt-2">
              {planStatus.hasScheduledChange && (
                <div className="rounded bg-yellow-100 p-3 text-yellow-800">
                  <p className="font-medium">{planStatus.message}</p>
                  {planStatus.daysUntilChange && (
                    <p className="text-sm">
                      Effective in {planStatus.daysUntilChange} day
                      {planStatus.daysUntilChange > 1 ? 's' : ''}
                    </p>
                  )}
                  {planStatus.effectiveDate && (
                    <p className="text-sm">
                      Effective date:{' '}
                      {new Date(planStatus.effectiveDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={syncPlan}
          disabled={syncingPlan || loadingPlanStatus}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {syncingPlan ? 'Syncing...' : 'Sync Plan'}
        </button>
      </div>

      {/* Plan Change Status */}
      {planChangeStatus && (
        <div
          className={`mb-6 rounded p-3 text-center ${
            planChangeStatus.includes('Failed')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {planChangeStatus}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Store Tier */}
        <div
          className={`rounded-lg border-2 p-6 ${plan === 'store' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <h3 className="mb-4 text-xl font-semibold">Store Tier</h3>
          <div className="mb-4">
            <span className="text-2xl font-bold text-green-600">Free</span>
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              3000 text (or url) entries a month
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              300 image entries a month
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              iOS Shortcuts integration
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              Chrome Extension
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              Companion access
            </li>
          </ul>
          {plan === 'store' ? (
            <div className="rounded bg-blue-100 p-3 text-center text-blue-800">
              Current Plan
            </div>
          ) : (
            <button
              type="button"
              onClick={() => changePlan('store')}
              disabled={changingPlan === 'store'}
              className="w-full rounded bg-gray-500 p-3 text-white hover:bg-gray-600 disabled:opacity-50"
            >
              {changingPlan === 'store' ? 'Switching...' : 'Switch to Store'}
            </button>
          )}
        </div>

        {/* Search Tier */}
        <div
          className={`rounded-lg border-2 p-6 ${plan === 'search' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
        >
          <h3 className="mb-4 text-xl font-semibold">Search Tier</h3>
          <div className="mb-4">
            <span className="text-2xl font-bold text-blue-600">$10</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              Everything in Store tier
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-500">+</span>
              +9000 text (or url) entries a month
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-500">+</span>
              +900 image entries a month
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-500">+</span>
              Search as you type
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-500">+</span>
              Image OCR
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-500">+</span>
              Support the project
            </li>
          </ul>
          {plan === 'search' ? (
            <div className="rounded bg-blue-100 p-3 text-center text-blue-800">
              Current Plan
            </div>
          ) : (
            <button
              type="button"
              onClick={() => changePlan('search')}
              disabled={changingPlan === 'search'}
              className="w-full rounded bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {changingPlan === 'search' ? 'Switching...' : 'Upgrade to Search'}
            </button>
          )}
        </div>

        {/* Synthesis Tier */}
        <div className="rounded-lg border-2 border-gray-200 p-6 opacity-75">
          <h3 className="mb-4 text-xl font-semibold">Synthesis Tier</h3>
          <div className="mb-4">
            <span className="text-2xl font-bold text-purple-600">
              Coming Soon
            </span>
          </div>
          <ul className="mb-6 space-y-2 text-sm">
            <li className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              Everything in Search tier
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-purple-500">+</span>
              ChatYCB
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-purple-500">+</span>
              TF-IDF
            </li>
          </ul>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded bg-gray-300 p-3 text-gray-500"
          >
            Coming Soon
          </button>
        </div>
      </div>
      <h3 className="mb-2 text-xl font-semibold">Download CSV:</h3>
      <DownloadCSVButton />
    </>
  );
}
