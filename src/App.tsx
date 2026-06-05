import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { FileUpload } from './components/FileUpload';
import { FolderBrowser } from './components/FolderBrowser';
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

type AppUser = {
  username?: string;
  attributes?: { email?: string };
};

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user as AppUser);
      } catch {
        setCurrentUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    loadUser();

    const authListener = ({ payload }: any) => {
      if (payload.event === 'signIn') {
        getCurrentUser()
          .then((user: AppUser) => setCurrentUser(user))
          .catch(() => setCurrentUser(null));
      }
      if (payload.event === 'signOut') {
        setCurrentUser(null);
      }
    };

    const removeAuthListener = Hub.listen('auth', authListener);
    return removeAuthListener;
  }, []);

  if (isCheckingSession) return null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100">
      <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[32px] bg-white/95 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
          <div className="flex flex-col items-center justify-center gap-4 text-center mb-8">
            <img src="/Q.svg" alt="Qualityze Logo" className="h-20 w-20" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Cross-Account Storage
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Upload files to cross-account S3 with Glacier storage class
              </p>
            </div>
          </div>
          <Authenticator
            className="w-full"
            loginMechanisms={['email']}
            signUpAttributes={['email']}
            components={{
              Header: () => null,
            }}
          />
        </div>
      </div>
    </div>
  );
  }

  const userEmail = currentUser?.attributes?.email || currentUser?.username || 'User';
  const userInitials = userEmail
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join('');

  return (
    <AppLayout
      onSignOut={() => signOut()}
      userName={userEmail}
      userInitials={userInitials}
    >
      <FileUpload onUploadComplete={handleUploadComplete} />
      <FolderBrowser key={refreshKey} />
    </AppLayout>
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
              <img src="/Q.svg" alt="Logo" className="h-40 w-40" />
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

