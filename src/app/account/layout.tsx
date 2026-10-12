import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AccountNavTabs } from '@/components/account/AccountNavTabs';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth?redirect=/account/profile');
  }

  return (
    <div className="bg-slate-50/60 min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <AccountNavTabs userName={user.fullName || user.email} />
        {children}
      </div>
    </div>
  );
}
