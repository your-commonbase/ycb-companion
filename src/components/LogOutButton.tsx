'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

const LogOutButton = () => {
  const router = useRouter();
  const { signOut } = useClerk();
  const t = useTranslations('DashboardLayout');

  return (
    <button
      className="h-24 border border-black aspect-square p-1 text-left text-sm flex items-start justify-start"
      type="button"
      onClick={() => signOut(() => router.push('/'))}
    >
      {t('sign_out')}
    </button>
  );
};

export { LogOutButton };
