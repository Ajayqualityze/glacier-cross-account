import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { FileUpload } from './components/FileUpload';
import { FolderBrowser } from './components/FolderBrowser';
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if user already has a session before showing Authenticator
  useEffect(() => {
    getCurrentUser()
      .then(() => setHasSession(true))
      .catch(() => setHasSession(false))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setHasSession(false);
  };

  // Show nothing while checking session
  if (isCheckingSession) return null;

  // If session exists, skip Authenticator entirely to avoid "already signed in" error
  if (hasSession) {
    return (
      <AppLayout onSignOut={handleSignOut}>
        <FileUpload onUploadComplete={handleUploadComplete} />
        <FolderBrowser key={refreshKey} />
      </AppLayout>
    );
  }

  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email']}
    >
      {({ signOut }) => (
        <AppLayout onSignOut={() => signOut?.()}>
          <FileUpload onUploadComplete={handleUploadComplete} />
          <FolderBrowser key={refreshKey} />
        </AppLayout>
      )}
    </Authenticator>
  );
}

function AppLayout({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Glacier Cross-Account Storage
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Upload files to cross-account S3 with Glacier storage class
              </p>
            </div>
            <div className="text-right">
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
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-600">
        <p>All files are stored with GLACIER storage class in the cross-account S3 bucket</p>
      </footer>
    </div>
  );
}

