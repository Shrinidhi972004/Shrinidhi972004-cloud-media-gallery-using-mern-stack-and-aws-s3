import React, { useState } from 'react';

export default function Login({ setToken, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      alert('Login successful!');
    } else {
      alert('Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-white">Welcome to the Gallery</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Login</h2>
        <div className="mb-4">
          <input
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <input
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          <label htmlFor="showPassword" className="text-sm text-gray-700">
            Show Password
          </label>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded transition"
        >
          Login
        </button>
        <p className="mt-4 text-center text-sm text-gray-700">
          Don’t have an account?{' '}
          <button className="text-blue-500 underline" onClick={onSwitchToRegister}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}
