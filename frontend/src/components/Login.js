import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login({ setToken, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Top Accent Bar */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-30"></div>
      
      {/* Logo Area */}
      <div className="mb-8 text-center">
        <div className="inline-block p-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full mb-4">
          <div className="p-4 bg-gray-900 rounded-full">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                <path d="M12 1.5a.75.75 0 01.75.75V7.5h-1.5V2.25A.75.75 0 0112 1.5zM11.25 7.5v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
              </svg>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold mb-2 text-white">Welcome to Gallery</h1>
        <p className="text-gray-300">Your personal media collection</p>
      </div>
      
      {/* Login Form */}
      <div className="w-full max-w-md">
        <div className="bg-gray-800 bg-opacity-40 backdrop-blur-lg p-8 rounded-xl shadow-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign In</h2>
          
          {error && (
            <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-500 text-red-300 py-2 px-3 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label className="text-sm font-medium text-gray-300 block mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 pl-10 pr-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-300 block mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg py-3 pl-10 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow transition duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <LogIn size={18} className="mr-2" />
            )}
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <button 
                className="text-blue-400 hover:text-blue-300 font-medium transition" 
                onClick={onSwitchToRegister}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>© 2025 Gallery App. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}