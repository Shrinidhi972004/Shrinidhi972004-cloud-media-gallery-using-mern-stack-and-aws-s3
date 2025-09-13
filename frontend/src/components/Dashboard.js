import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Upload, Image, FileVideo, File, X, Maximize, Check, Trash2, RefreshCw, LogOut, Grid, Calendar, Clock } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export default function Dashboard({ token, onLogout }) {
  // State
  const [files, setFiles] = useState([]); // [{ fileId, fileName, url, fileSize, type, duration?, uploadDate: Date }]
  const [folders, setFolders] = useState([]); // ["folder1", "folder2"]
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // all | day | month | year
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set()); // Set of fileIds
  const [layout, setLayout] = useState('grid'); // grid | list
  const [editingFileId, setEditingFileId] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [currentFolder, setCurrentFolder] = useState('/');

  // Refs
  const fullscreenRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helpers
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (secs) => {
    if (!secs && secs !== 0) return '';
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    const m = Math.floor((secs / 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(secs / 3600);
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const getFileIcon = (f) => {
    if (f.type?.startsWith && f.type.startsWith('image')) return <Image size={18} />;
    if (f.type?.startsWith && f.type.startsWith('video')) return <FileVideo size={18} />;
    if (typeof f.type === 'string') {
      if (f.type === 'image') return <Image size={18} />;
      if (f.type === 'video') return <FileVideo size={18} />;
    }
    return <File size={18} />;
  };

  const getBreadcrumbs = () => {
    const parts = currentFolder.split('/').filter(Boolean);
    const crumbs = [{ name: 'Home', path: '/' }];
    let path = '';
    for (const part of parts) {
      path = path === '' || path === '/' ? `/${part}` : `${path}/${part}`;
      crumbs.push({ name: part, path });
    }
    return crumbs;
  };

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/gallery/files?folder=${encodeURIComponent(currentFolder)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        toast.error('Session expired. Please log in again.');
        onLogout?.();
        return;
      }
      if (!res.ok) {
        let msg = 'Failed to fetch files';
        try {
          const err = await res.json();
          if (err?.msg) msg = err.msg;
        } catch (_) {
          // ignore
        }
        throw new Error(msg);
      }
      const data = await res.json();
      const normalized = (data.files || []).map((f) => ({
        ...f,
        uploadDate: f.uploadDate ? new Date(f.uploadDate) : new Date(),
      }));
      setFiles(normalized);
      setFolders(Array.isArray(data.folders) ? data.folders : []);
      setSelectedFiles(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load files');
    }
  }, [currentFolder, token, onLogout]);

  useEffect(() => {
    if (token) fetchFiles();
  }, [fetchFiles, token]);

  const filteredFiles = () => {
    if (viewMode === 'all') return files;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const monthMs = 30 * dayMs;
    const yearMs = 365 * dayMs;
    const windowMs = viewMode === 'day' ? dayMs : viewMode === 'month' ? monthMs : yearMs;
    return files.filter((f) => {
      const ts = f.uploadDate instanceof Date ? f.uploadDate.getTime() : new Date(f.uploadDate).getTime();
      return now - ts <= windowMs;
    });
  };

  // Uploads
  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const tasks = Array.from(fileList).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', currentFolder);
        const resp = await fetch(`${API_URL}/api/gallery/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!resp.ok) throw new Error('Upload failed');
      });
      await Promise.all(tasks);
      toast.success(`${fileList.length} file(s) uploaded`);
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = (e) => uploadFiles(e.target.files);

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const dtFiles = e.dataTransfer.files;
    uploadFiles(dtFiles);
  };

  // Selection
  const toggleSelectFile = (fileId, e) => {
    if (e) e.stopPropagation();
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const visible = filteredFiles();
    if (selectedFiles.size === visible.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(visible.map((f) => f.fileId)));
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedFiles);
    if (ids.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/api/gallery/delete-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileIds: ids }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Deleted selected files');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete files');
    }
  };

  // Rename
  const handleRenameFile = async (fileId) => {
    if (!newFileName.trim()) {
      toast.error('Enter a valid name');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/gallery/rename/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newFileName }),
      });
      if (!res.ok) throw new Error('Rename failed');
      toast.success('File name updated');
      setEditingFileId(null);
      setNewFileName('');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update file name');
    }
  };

  // Update file content
  const handleUpdateFile = (fileId) => {
    const el = document.getElementById(`update-input-${fileId}`);
    if (el) el.click();
  };

  const handleFileChange = async (e, fileId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/gallery/update/${fileId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('File updated');
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update file');
    } finally {
      e.target.value = '';
    }
  };

  // Fullscreen image
  const handleFullscreen = () => {
    const elem = fullscreenRef.current;
    if (!elem) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      elem.requestFullscreen?.();
    }
  };

  // New folder creation (implicit by navigation)
  const handleCreateFolder = async () => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName || /[\\/:*?"<>|]/.test(folderName)) {
      toast.error('Invalid folder name.');
      return;
    }
    setCurrentFolder(currentFolder === '/' ? `/${folderName}` : `${currentFolder}/${folderName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white bg-opacity-80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
              Immersive Gallery
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-4 py-2 rounded-lg shadow-md text-white transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              <Upload size={18} />
              <span>Upload</span>
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white active:scale-95 transition px-4 py-2 rounded-lg shadow-md"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4">
          {getBreadcrumbs().map((crumb, idx, arr) => (
            <span key={crumb.path} className="flex items-center">
              <button
                className={`text-blue-600 hover:underline text-sm ${idx === arr.length - 1 ? 'font-bold' : ''}`}
                onClick={() => setCurrentFolder(crumb.path)}
                disabled={idx === arr.length - 1}
              >
                {crumb.name}
              </button>
              {idx < arr.length - 1 && <span className="mx-1 text-gray-400">/</span>}
            </span>
          ))}
          <button
            className="ml-4 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
            onClick={handleCreateFolder}
          >
            + New Folder
          </button>
        </div>

        {/* Upload Dropzone */}
        <div
          className="mb-8 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center transition-all duration-200 cursor-pointer hover:border-blue-400 bg-white shadow-sm hover:bg-blue-50"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={48} className="mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Drag & Drop or Click to Upload</h3>
          <p className="text-gray-500">Upload your images, videos, and files to the gallery</p>
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-blue-500">Uploading files...</span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 rounded-lg transition shadow-sm ${layout === 'grid' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
              title="Grid View"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition shadow-sm ${layout === 'list' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
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
            {['all', 'day', 'month', 'year'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition shadow-sm ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
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
                className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-gray-800 px-3 py-1 rounded-lg shadow-sm transition-all duration-200"
              >
                <Check size={16} />
                {selectedFiles.size === filteredFiles().length ? 'Deselect All' : 'Select All'}
              </button>

              {selectedFiles.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow-sm transition-all duration-200"
                >
                  <Trash2 size={16} />
                  Delete ({selectedFiles.size})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {folders.length === 0 && filteredFiles().length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <Image size={64} className="mb-4 opacity-50" />
            <p className="text-xl font-medium">No files or folders to display</p>
            <p className="mt-2">Upload some files or create a folder to get started</p>
          </div>
        )}

        {/* Grid view (folders above files) */}
        {layout === 'grid' && (
          <>
            {/* Folders Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3.28a2 2 0 011.42.59l.71.7a2 2 0 001.42.59H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                Folders
              </h2>
              {folders.length === 0 ? (
                <div className="text-gray-400 italic">No folders</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {folders.map((folderName) => (
                    <div
                      key={folderName}
                      className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md bg-white transition duration-200 transform hover:scale-105 cursor-pointer border-2 border-blue-200"
                      onClick={() => setCurrentFolder(currentFolder === '/' ? `/${folderName}` : `${currentFolder}/${folderName}`)}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3.28a2 2 0 011.42.59l.71.7a2 2 0 001.42.59H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                        <span className="font-semibold text-blue-700 text-center truncate w-full">{folderName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3 text-indigo-700 flex items-center gap-2">
                <Grid size={20} className="text-indigo-400" />
                Files
              </h2>
              {filteredFiles().length === 0 ? (
                <div className="text-gray-400 italic">No files</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredFiles().map((f) => (
                    <div
                      key={f.fileId}
                      className={`relative group rounded-xl overflow-hidden shadow-sm hover:shadow-md bg-white transition duration-200 transform hover:scale-105 ${
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
                              : 'bg-white bg-opacity-90 text-gray-700 border border-gray-200 hover:bg-blue-500 hover:text-white'
                          }`}
                        >
                          <Check size={16} className={selectedFiles.has(f.fileId) ? 'opacity-100' : 'opacity-0'} />
                        </button>
                      </div>

                      <div onClick={() => setSelectedFile(f)} className="w-full aspect-square bg-gray-100 cursor-pointer">
                        {f.type?.startsWith('image') ? (
                          <img src={f.url} alt={f.fileName} className="w-full h-full object-cover group-hover:opacity-90 transition" loading="lazy" />
                        ) : f.type?.startsWith('video') ? (
                          <div className="relative h-full">
                            <video src={f.url} className="w-full h-full object-cover group-hover:opacity-90 transition" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white bg-opacity-75">
                                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-800 border-b-8 border-b-transparent ml-1"></div>
                              </div>
                            </div>
                            {typeof f.duration === 'number' && (
                              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {formatDuration(f.duration)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100">
                            <File size={48} className="text-gray-500 mb-2" />
                            <p className="truncate text-sm text-center w-full text-gray-700" title={f.fileName}>
                              {f.fileName}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-white border-t border-gray-100">
                        {editingFileId === f.fileId ? (
                          <span className="flex items-center gap-2">
                            <input className="border rounded px-2 py-1 text-sm w-32" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus />
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={(e) => { e.stopPropagation(); handleRenameFile(f.fileId); }}>Save</button>
                            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs" onClick={(e) => { e.stopPropagation(); setEditingFileId(null); setNewFileName(''); }}>Cancel</button>
                          </span>
                        ) : (
                          <span className="font-medium truncate max-w-xs text-gray-800 flex items-center gap-2">
                            {f.fileName}
                            <button className="text-blue-500 hover:underline text-xs" onClick={(e) => { e.stopPropagation(); setEditingFileId(f.fileId); setNewFileName(f.fileName); }} title="Edit file name">Edit</button>
                          </span>
                        )}
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                          <span>{formatFileSize(f.fileSize)}</span>
                          <span>{(f.uploadDate instanceof Date ? f.uploadDate : new Date(f.uploadDate)).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateFile(f.fileId);
                            }}
                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1 rounded transition"
                          >
                            <RefreshCw size={12} />
                            Update
                          </button>
                          <input type="file" accept="image/*,video/*" id={`update-input-${f.fileId}`} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, f.fileId)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* List view (files only) */}
        {layout === 'list' && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-200">
                  <th className="p-3 w-10"></th>
                  <th className="p-3 text-gray-700">File</th>
                  <th className="p-3 hidden md:table-cell text-gray-700">Type</th>
                  <th className="p-3 hidden sm:table-cell text-gray-700">Size</th>
                  <th className="p-3 hidden lg:table-cell text-gray-700">Date</th>
                  <th className="p-3 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles().map((f) => (
                  <tr
                    key={f.fileId}
                    className={`border-t border-gray-100 hover:bg-blue-50 transition cursor-pointer ${selectedFiles.has(f.fileId) ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedFile(f)}
                  >
                    <td className="p-3">
                      <div className="w-6 h-6 rounded-md border border-gray-300 flex items-center justify-center cursor-pointer" onClick={(e) => toggleSelectFile(f.fileId, e)}>
                        {selectedFiles.has(f.fileId) && <Check size={14} className="text-blue-500" />}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {f.type?.startsWith('image') ? (
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                            <img src={f.url} alt={f.fileName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-500">{getFileIcon(f)}</div>
                        )}
                        {editingFileId === f.fileId ? (
                          <div className="flex items-center gap-2">
                            <input className="border rounded px-2 py-1 text-sm w-32" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} autoFocus />
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" onClick={() => handleRenameFile(f.fileId)}>Save</button>
                            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs" onClick={() => { setEditingFileId(null); setNewFileName(''); }}>Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-gray-800" title={f.fileName}>{f.fileName}</p>
                            <button className="text-blue-500 hover:underline text-xs" onClick={() => { setEditingFileId(f.fileId); setNewFileName(f.fileName); }} title="Edit file name">Edit</button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-600">{(typeof f.type === 'string' && f.type.includes('/')) ? f.type.split('/')[0] : f.type || 'Unknown'}</td>
                    <td className="p-3 hidden sm:table-cell text-gray-600">{formatFileSize(f.fileSize)}</td>
                    <td className="p-3 hidden lg:table-cell text-gray-600">{(f.uploadDate instanceof Date ? f.uploadDate : new Date(f.uploadDate)).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateFile(f.fileId);
                        }}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1 rounded transition"
                      >
                        <RefreshCw size={12} />
                        Update
                      </button>
                      <input type="file" accept="image/*,video/*" id={`update-input-${f.fileId}`} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, f.fileId)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview overlay */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div ref={fullscreenRef} className="relative w-full h-full flex items-center justify-center">
            <div className="absolute top-4 right-4 flex gap-4 z-50">
              {selectedFile.type?.startsWith('image') && (
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 transition" onClick={handleFullscreen} title="Toggle Fullscreen">
                  <Maximize size={20} />
                </button>
              )}
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-90 hover:bg-red-500 hover:text-white text-gray-800 transition" onClick={() => setSelectedFile(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 md:p-8 w-full h-full flex items-center justify-center">
              {selectedFile.type?.startsWith('image') ? (
                <img src={selectedFile.url} alt={selectedFile.fileName} className="max-w-full max-h-full object-contain pointer-events-none" />
              ) : selectedFile.type?.startsWith('video') ? (
                <video src={selectedFile.url} controls autoPlay className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="bg-white p-8 rounded-xl max-w-md text-center shadow-lg">
                  <File size={80} className="text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{selectedFile.fileName}</h3>
                  <p className="text-gray-600 mb-4">{formatFileSize(selectedFile.fileSize)} • Uploaded on {(selectedFile.uploadDate instanceof Date ? selectedFile.uploadDate : new Date(selectedFile.uploadDate)).toLocaleDateString()}</p>
                  <a href={selectedFile.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">Open File</a>
                </div>
              )}
            </div>

            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
              <p className="text-center text-gray-800">{selectedFile.fileName}</p>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}