import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { FileUpload } from './components/FileUpload';
import { FolderBrowser } from './components/FolderBrowser';
import { useState, useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

type AppUser = {
  username?: string;
  attributes?: { email?: string };
};

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if user already has a session (for state management)
  useEffect(() => {
    getCurrentUser()
      .finally(() => setIsCheckingSession(false));
  }, []);

  // Show nothing while checking session
  if (isCheckingSession) return null;

  // Always show Authenticator to allow sign-up, even when session exists
  // Authenticator handles existing sessions appropriately
  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email']}
      components={{
        Header: () => (
          <div className="flex flex-col items-center justify-center gap-6 mb-6 px-4 text-center sm:flex-row sm:text-left sm:items-center">
        <img src="/Q.svg" alt="Qualityze Logo" className="h-28 w-28" />
        <div className="max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Cross-Account Storage
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Upload files to cross-account S3 with Glacier storage class
          </p>
        </div>
      </div>
        ),
      }}
    >
      {({ signOut, user }: { signOut?: () => void; user?: AppUser }) => {
        const userEmail = user?.attributes?.email || user?.username || 'User';
        const userInitials = userEmail
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0].toUpperCase())
          .join('');

        return (
          <AppLayout
            onSignOut={() => signOut?.()}
            userName={userEmail}
            userInitials={userInitials}
          >
            <FileUpload onUploadComplete={handleUploadComplete} />
            <FolderBrowser key={refreshKey} />
          </AppLayout>
        );
      }}
    </Authenticator>
  );
}

function AppLayout({ children, onSignOut, userName, userInitials }: { children: React.ReactNode; onSignOut: () => void; userName: string; userInitials: string }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <img src="/Q.svg" alt="Logo" className="h-24 w-24" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Glacier Cross-Account Storage
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Upload files to cross-account S3 with Glacier storage class
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-gray-100 px-3 py-2 rounded-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                  {userInitials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="mt-2 px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full mx-auto px-4 py-8 sm:px-6 lg:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-600">
        <p>All files are stored with GLACIER storage class in the cross-account S3 bucket</p>
      </footer>
    </div>
  );
}

