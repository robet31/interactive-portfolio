import { RouterProvider } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';
import { ErrorBoundary } from './components/error-boundary';
import { Suspense, useEffect, useState } from 'react';
import { preloadAllData } from './lib/db';
import { LoadingScreen } from './components/loading-screen';

// Force dark mode — always
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
}

export default function App() {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    preloadAllData().finally(() => setIsPreloading(false));
  }, []);

  if (isPreloading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </Suspense>
    </ErrorBoundary>
  );
}