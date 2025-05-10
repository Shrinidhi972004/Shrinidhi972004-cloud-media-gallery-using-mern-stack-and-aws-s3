import React, { useState, useEffect } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState('');
  const [page, setPage] = useState('login');
  const [loading, setLoading] = useState(true);

  // Check for existing token in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('gallery_token');
    if (savedToken) {
      setToken(savedToken);
    }
    // Add a small delay to show splash screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('gallery_token', token);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('gallery_token');
    setToken('');
    setPage('login');
  };

  // Initial loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col items-center justify-center">
        <div className="animate-pulse mb-4">
          <div className="inline-block p-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full">
            <div className="p-4 bg-gray-900 rounded-full">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M12 1.5a.75.75 0 01.75.75V7.5h-1.5V2.25A.75.75 0 0112 1.5zM11.25 7.5v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold mb-2 text-white">Gallery</h1>
        <p className="text-gray-300">Loading your experience...</p>
      </div>
    );
  }

  // Render the Dashboard if authenticated
  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Auth screens (Login/Register)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-gray-100">
      {page === 'login' ? (
        <Login 
          setToken={(newToken) => {
            setToken(newToken);
          }} 
          onSwitchToRegister={() => setPage('register')} 
        />
      ) : (
        <Register 
          onRegisterSuccess={() => setPage('login')} 
          setPage={setPage} 
        />
      )}
    </div>
  );
}

export default App;