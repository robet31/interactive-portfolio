import { Outlet } from 'react-router';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { ScrollToTop } from './scroll-to-top';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
