'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing',
  );
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processCheckout = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setMessage('No session ID found. Please try again.');
        return;
      }

      try {
        const response = await fetch('/api/checkoutSuccess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await response.json();

        setStatus('success');
        setMessage('Payment successful! Your plan has been updated.');

        // Redirect to settings after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/settings');
        }, 3000);
      } catch (error) {
        console.error('Error processing checkout:', error);
        setStatus('error');
        setMessage(
          'There was an error processing your payment. Please contact support.',
        );
      }
    };

    processCheckout();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Processing Payment
              </h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="size-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-green-600">
                Payment Successful!
              </h1>
              <p className="mb-4 text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting to settings in 3 seconds...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="size-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-red-600">
                Payment Error
              </h1>
              <p className="mb-6 text-gray-600">{message}</p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/settings')}
                className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Return to Settings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
