import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, Home, RefreshCw } from 'lucide-react';
import { GlacierAPI, type FileInfo } from '../api/glacier';

export function FolderBrowser() {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<string>('');

  useEffect(() => {
    loadFolderContents();
  }, [currentPath]);

  const loadFolderContents = async () => {
    setLoading(true);
    setError(null);
    try {
      const prefix = currentPath.length > 0 ? currentPath.join('/') + '/' : '';
      const result = await GlacierAPI.listFolders(prefix);
      
      setFolders(result.folders);
      setFiles(result.files);
      setBucket(result.bucket || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder contents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    const parts = folderPath.replace(/\/+$/, '').split('/').filter(Boolean);
    setCurrentPath(parts);
  };

  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const goToRoot = () => {
    setCurrentPath([]);
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="w-full text-3xl font-bold text-gray-800 mb-2">Cross-Account S3 Browser</h2>
        {bucket && (
          <p className="text-sm text-gray-600">Bucket: <span className="font-mono">{bucket}</span></p>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded">
        <button
          onClick={goToRoot}
          className="p-1 hover:bg-gray-200 rounded"
          title="Go to root"
        >
          <Home className="w-4 h-4 text-gray-600" />
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        {currentPath.length === 0 ? (
          <span className="text-sm text-gray-600">Root</span>
        ) : (
          <div className="flex items-center gap-2">
            {currentPath.map((part, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {part}
                </button>
                {index < currentPath.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={loadFolderContents}
          className="ml-auto p-2 hover:bg-gray-200 rounded"
          title="Refresh"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No files or folders found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Size</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Storage Class</th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700">Modified</th>
              </tr>
            </thead>
            <tbody>
              {/* Parent folder link */}
              {currentPath.length > 0 && (
                <tr 
                  onClick={navigateUp}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3 flex items-center gap-2" colSpan={4}>
                    <Folder className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">..</span>
                  </td>
                </tr>
              )}

              {/* Folders */}
              {folders.map((folder) => {
                const displayName = folder.replace(/\/+$/, '').split('/').pop() || folder;
                return (
                  <tr
                    key={folder}
                    onClick={() => navigateToFolder(folder)}
                    className="border-b hover:bg-blue-50 cursor-pointer"
                  >
                    <td className="p-3 flex items-center gap-2">
                      <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-blue-600 font-medium">{displayName}</span>
                    </td>
                    <td className="p-3 text-gray-500 text-sm">-</td>
                    <td className="p-3 text-gray-500 text-sm">-</td>
                    <td className="p-3 text-gray-500 text-sm">-</td>
                  </tr>
                );
              })}

              {/* Files */}
              {files.map((file) => {
                const displayName = file.key.split('/').pop() || file.key;
                return (
                  <tr key={file.key} className="border-b hover:bg-gray-50">
                    <td className="p-3 flex items-center gap-2">
                      <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-800">{displayName}</span>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">
                      {GlacierAPI.formatBytes(file.size)}
                    </td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        file.storageClass === 'GLACIER' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {file.storageClass}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 text-sm">
                      {new Date(file.lastModified).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
