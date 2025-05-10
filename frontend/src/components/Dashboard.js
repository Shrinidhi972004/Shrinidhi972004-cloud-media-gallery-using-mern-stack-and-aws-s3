import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Upload, Image, FileVideo, File, X, Maximize, Check, Trash2, RefreshCw, LogOut, Grid, Calendar, Clock } from 'lucide-react';

export default function Dashboard({ token, onLogout }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [layout, setLayout] = useState('grid');
  const fullscreenRef = useRef(null);
  const fileInputRef = useRef(null);

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
      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
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

  const toggleSelectFile = (fileId, event) => {
    if (event) {
      event.stopPropagation();
    }
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('border-blue-400');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400');
    if (e.dataTransfer.files.length > 0) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.multiple = true;
      fileInput.files = e.dataTransfer.files;
      handleUpload({ target: fileInput });
    }
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image')) {
      return <Image className="w-8 h-8" />;
    } else if (file.type?.startsWith('video')) {
      return <FileVideo className="w-8 h-8" />;
    } else {
      return <File className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 font-sans">
      <div className="sticky top-0 z-10 bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Immersive Gallery
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
            >
              <Upload size={18} />
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 transition px-4 py-2 rounded-lg shadow-lg"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div 
          className="mb-8 border-2 border-dashed border-gray-600 rounded-xl p-10 text-center transition-all duration-200 cursor-pointer hover:border-blue-400 bg-gray-800 bg-opacity-50 hover:bg-opacity-70"
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-semibold mb-2">Drag & Drop or Click to Upload</h3>
          <p className="text-gray-400">Upload your images, videos, and files to the gallery</p>
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-400">Uploading files...</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition ${layout === 'grid' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              title="Grid View"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition ${layout === 'list' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              title="List View"
            >
              <div className="w-5 h-5 flex flex-col justify-between">
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'day', 'month', 'year'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition shadow ${
                  viewMode === mode 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {mode === 'day' && <Clock size={14} />}
                {mode === 'month' && <Calendar size={14} />}
                {mode === 'year' && <Calendar size={14} />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded-lg shadow transition-all duration-200"
              >
                <Check size={16} />
                {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedFiles.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow transition-all duration-200"
                >
                  <Trash2 size={16} />
                  Delete ({selectedFiles.size})
                </button>
              )}
            </div>
          )}
        </div>

        {filteredFiles().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Image size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">No files to display</p>
            <p className="mt-2">Upload some files to get started</p>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles().map(f => (
              <div
                key={f.fileId}
                className={`relative group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition duration-200 transform hover:scale-105 ${
                  selectedFiles.has(f.fileId) ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
              >
                <div 
                  className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => toggleSelectFile(f.fileId, e)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      selectedFiles.has(f.fileId) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-black bg-opacity-50 text-white hover:bg-blue-500'
                    }`}
                  >
                    <Check size={16} className={selectedFiles.has(f.fileId) ? 'opacity-100' : 'opacity-0'} />
                  </button>
                </div>

                <div 
                  onClick={() => setSelectedFile(f)}
                  className="w-full aspect-square bg-gray-800 cursor-pointer"
                >
                  {f.type?.startsWith('image') ? (
                    <img
                      src={f.url}
                      alt={f.fileName}
                      className="w-full h-full object-cover group-hover:opacity-90 transition"
                      loading="lazy"
                    />
                  ) : f.type?.startsWith('video') ? (
                    <div className="relative h-full">
                      <video
                        src={f.url}
                        className="w-full h-full object-cover group-hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-75">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-800 border-b-8 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(f.duration)}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-700">
                      <File size={48} className="text-gray-400 mb-2" />
                      <p className="truncate text-sm text-center w-full" title={f.fileName}>
                        {f.fileName}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-800">
                  <p className="truncate font-medium" title={f.fileName}>{f.fileName}</p>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                    <span>{formatFileSize(f.fileSize)}</span>
                    <span>{f.uploadDate.toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateFile(f.fileId);
                      }}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded transition"
                    >
                      <RefreshCw size={12} />
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700 text-left">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">File</th>
                  <th className="p-3 hidden md:table-cell">Type</th>
                  <th className="p-3 hidden sm:table-cell">Size</th>
                  <th className="p-3 hidden lg:table-cell">Date</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles().map(f => (
                  <tr 
                    key={f.fileId} 
                    className={`border-t border-gray-700 hover:bg-gray-700 transition cursor-pointer ${
                      selectedFiles.has(f.fileId) ? 'bg-blue-900 bg-opacity-30' : ''
                    }`}
                    onClick={() => setSelectedFile(f)}
                  >
                    <td className="p-3">
                      <div 
                        className="w-6 h-6 rounded-md border border-gray-500 flex items-center justify-center cursor-pointer"
                        onClick={(e) => toggleSelectFile(f.fileId, e)}
                      >
                        {selectedFiles.has(f.fileId) && <Check size={14} className="text-blue-400" />}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {f.type?.startsWith('image') ? (
                          <div className="w-10 h-10 bg-gray-700 rounded overflow-hidden">
                            <img src={f.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                            {getFileIcon(f)}
                          </div>
                        )}
                        <span className="font-medium truncate max-w-xs">{f.fileName}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-400">
                      {f.type?.split('/')[0] || 'Unknown'}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-gray-400">
                      {formatFileSize(f.fileSize)}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-gray-400">
                      {f.uploadDate.toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateFile(f.fileId);
                        }}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2 py-1 rounded transition"
                      >
                        <RefreshCw size={12} />
                        Update
                      </button>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        id={`update-input-${f.fileId}`}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, f.fileId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div ref={fullscreenRef} className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-4 right-4 flex gap-4 z-50">
              {selectedFile.type?.startsWith('image') && (
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-white transition"
                  onClick={handleFullscreen}
                  title="Toggle Fullscreen"
                >
                  <Maximize size={20} />
                </button>
              )}
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-red-600 text-white transition"
                onClick={() => setSelectedFile(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 md:p-8 w-full h-full flex items-center justify-center">
              {selectedFile.type?.startsWith('image') ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.fileName}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                />
              ) : selectedFile.type?.startsWith('video') ? (
                <video
                  src={selectedFile.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="bg-gray-800 p-8 rounded-xl max-w-md text-center">
                  <File size={80} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{selectedFile.fileName}</h3>
                  <p className="text-gray-400 mb-4">
                    {formatFileSize(selectedFile.fileSize)} • Uploaded on {selectedFile.uploadDate.toLocaleDateString()}
                  </p>
                  <a
                    href={selectedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
            
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-80 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-center">{selectedFile.fileName}</p>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}