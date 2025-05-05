import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Dashboard({ token, onLogout }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const fullscreenRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedFile(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchFiles = async () => {
    const res = await fetch('http://localhost:5000/api/gallery/files', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const processedFiles = data.files.map(f => ({
      ...f,
      uploadDate: new Date(f.uploadDate),
    }));
    setFiles(processedFiles);
  };

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        await fetch('http://localhost:5000/api/gallery/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      toast.success('Files uploaded!');
      fetchFiles();
    } catch (err) {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateFile = (fileId) => {
    const input = document.getElementById(`update-input-${fileId}`);
    if (input) input.click();
  };

  const handleFileChange = async (e, fileId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`http://localhost:5000/api/gallery/update/${fileId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        toast.success('File updated successfully!');
        fetchFiles();
      } else {
        toast.error('Failed to update file.');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Error updating file.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    const confirmDelete = window.confirm(`Delete ${selectedFiles.size} selected files?`);
    if (!confirmDelete) return;

    try {
      await fetch('http://localhost:5000/api/gallery/delete-multiple', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) }),
      });
      toast.success('Selected files deleted!');
      setSelectedFiles(new Set());
      fetchFiles();
    } catch (err) {
      toast.error('Failed to delete selected files.');
    }
  };

  const handleFullscreen = () => {
    if (fullscreenRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        fullscreenRef.current.requestFullscreen();
      }
    }
  };

  const toggleSelectFile = (fileId) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    setSelectedFiles(newSet);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.fileId)));
    }
  };

  const filteredFiles = () => {
    if (viewMode === 'all') return files;
    const now = new Date();
    return files.filter(f => {
      const d = f.uploadDate;
      if (viewMode === 'year') return d.getFullYear() === now.getFullYear();
      if (viewMode === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (viewMode === 'day') return d.toDateString() === now.toDateString();
      return true;
    });
  };

  const formatFileSize = (size) => {
    if (!size) return 'N/A';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Gallery</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 active:scale-95 transition px-4 py-2 rounded-lg shadow-lg"
          >
            Logout
          </button>
        </div>

        <div className="mb-6">
          <label className="block border-2 border-dashed border-gray-500 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition">
            <span className="text-lg">Click or drag files to upload</span>
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          {uploading && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'year', 'month', 'day'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full transition shadow ${viewMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-blue-500 hover:text-white'}`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {files.length > 0 && (
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded shadow"
            >
              {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedFiles.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
              >
                Delete Selected ({selectedFiles.size})
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFiles().map(f => (
            <div
              key={f.fileId}
              className="relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition"
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(f.fileId)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelectFile(f.fileId);
                }}
                className="absolute top-2 left-2 w-4 h-4 z-10"
              />

              <div onClick={() => setSelectedFile(f)}>
                {f.type?.startsWith('image') ? (
                  <img
                    src={f.url}
                    alt={f.fileName}
                    className="w-full h-40 object-cover group-hover:opacity-80 transition"
                  />
                ) : f.type?.startsWith('video') ? (
                  <div className="relative">
                    <video
                      src={f.url}
                      className="w-full h-40 object-cover group-hover:opacity-80 transition"
                    />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                      {formatDuration(f.duration)}
                    </span>
                  </div>
                ) : (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="block p-4">
                    {f.fileName}
                  </a>
                )}
              </div>

              <div className="p-2 text-sm">
                <p className="truncate" title={f.fileName}>{f.fileName}</p>
                <p className="text-xs text-gray-400">Size: {formatFileSize(f.fileSize)}</p>
                <p className="text-xs text-gray-400">Uploaded: {f.uploadDate.toLocaleDateString()}</p>
                <button
                  onClick={() => handleUpdateFile(f.fileId)}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded"
                >
                  Update
                </button>
                <input
                  type="file"
                  accept="image/*,video/*"
                  id={`update-input-${f.fileId}`}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e, f.fileId)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div ref={fullscreenRef} className="relative w-full h-full flex items-center justify-center">
            {selectedFile.type?.startsWith('image') && (
              <button
                className="absolute top-4 right-20 text-white text-4xl hover:text-green-400 transition z-50"
                onClick={handleFullscreen}
                title="Toggle Fullscreen"
              >
                ⛶
              </button>
            )}
            <button
              className="absolute top-4 right-6 text-white text-5xl hover:text-red-400 transition z-50"
              onClick={() => setSelectedFile(null)}
            >
              &times;
            </button>
            {selectedFile.type?.startsWith('image') ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.fileName}
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : selectedFile.type?.startsWith('video') ? (
              <video
                src={selectedFile.url}
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200 underline"
              >
                Open File
              </a>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}
