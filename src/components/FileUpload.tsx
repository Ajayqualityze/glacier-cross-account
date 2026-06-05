import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { GlacierAPI } from '../api/glacier';

export function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const result = await GlacierAPI.uploadFile(selectedFile, folderPath || undefined);
      
      if (result.success) {
        setUploadStatus({
          type: 'success',
          message: result.message || 'File uploaded successfully to Glacier storage',
        });
        setSelectedFile(null);
        setFolderPath('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Notify parent to refresh folder browser
        if (onUploadComplete) {
          setTimeout(onUploadComplete, 1000);
        }
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Upload failed',
        });
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-lg mb-6">
      <h2 className="w-full text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Upload className="w-6 h-6" />
        Upload to Glacier
      </h2>

      <div className="space-y-4">
        {/* Folder path input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Folder Path (optional)
          </label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="e.g., documents/2024"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to upload to root folder
          </p>
        </div>

        {/* File input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>

        {/* Selected file info */}
        {selectedFile && (
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected:</span> {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Size: {GlacierAPI.formatBytes(selectedFile.size)}
            </p>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading to Glacier...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload to Cross-Account S3 (Glacier)
            </>
          )}
        </button>

        {/* Status message */}
        {uploadStatus && (
          <div
            className={`p-3 rounded flex items-start gap-2 ${
              uploadStatus.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{uploadStatus.message}</p>
          </div>
        )}

        {/* Storage info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Files are uploaded with GLACIER storage class to the cross-account S3 bucket. 
            Glacier provides low-cost storage for long-term archival.
          </p>
        </div>
      </div>
    </div>
  );
}
