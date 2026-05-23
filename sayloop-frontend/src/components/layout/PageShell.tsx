import { useState, type ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';
import RightSidebar from '@/components/layout/RightSidebar';

type Props = {
  children: ReactNode;
  title?: string;
  hideRight?: boolean;
};

export default function PageShell({ children, title, hideRight }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-cream shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col pb-20 lg:pb-0">
        <TopBar title={title} onMenuOpen={() => setMenuOpen(true)} />
        <div className="flex flex-1">
          <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
          {!hideRight && <RightSidebar />}
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
