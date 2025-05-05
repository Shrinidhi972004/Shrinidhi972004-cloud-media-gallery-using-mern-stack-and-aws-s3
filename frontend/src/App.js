import React, { useState } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState('');
  const [page, setPage] = useState('login');

  const handleLogout = () => {
    setToken('');
    setPage('login');
  };

  if (token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-4 flex flex-col items-center justify-center">
      
      {page === 'login' ? (
        <Login setToken={setToken} onSwitchToRegister={() => setPage('register')} />
      ) : (
        <Register onRegisterSuccess={() => setPage('login')} setPage={setPage} />

      )}
    </div>
  );
}

export default App;
