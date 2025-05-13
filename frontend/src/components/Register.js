
import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      alert('Registration successful! Please log in.');
      onRegisterSuccess();
    } else {
      alert('Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-white">Welcome to the Gallery</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Register</h2>
        <input
          className="border p-2 mb-3 w-full rounded text-gray-900"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="border p-2 mb-3 w-full rounded text-gray-900"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border p-2 mb-3 w-full rounded text-gray-900"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="showRegisterPass"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="mr-2"
          />
          <label htmlFor="showRegisterPass" className="text-sm text-gray-700">
            Show Password
          </label>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
          onClick={handleRegister}
        >
          Register
        </button>
        <p className="mt-4 text-center text-sm text-gray-700">
          Already have an account?{' '}
          <button
            className="text-blue-500 underline"
            onClick={onSwitchToLogin}
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
}
