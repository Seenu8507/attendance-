// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() === 'mzcet' && password.trim() === 'sundar') {
      localStorage.setItem('user', JSON.stringify({ username }));
      toast.success('Welcome User!');
      setTimeout(() => navigate('/'), 3000);
    } else {
      toast.error('Invalid username or password');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow-xl w-96 space-y-6 animate-fade-in"
        >
          <h2 className="text-3xl font-bold text-center text-indigo-700">Login Here</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <br></br>
          <div>
            <label className="block text-sm font-medium text-black-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full p-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <br></br>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-black py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </>
  );
}

export default Login;
