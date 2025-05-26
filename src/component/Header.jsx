import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import mzcetLogo from "../assets/mzcet.png";
import LogoutButton from "./Logout";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getUserFromStorage = () => {
    return localStorage.getItem('user') || sessionStorage.getItem('user');
  };

  const [loggedInUser, setLoggedInUser] = useState(getUserFromStorage());
  const [showName, setShowName] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  useEffect(() => {
    const handleStorageChange = () => {
      setLoggedInUser(getUserFromStorage());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    setLoggedInUser(getUserFromStorage());
  }, [location]);

  useEffect(() => {
    if (showName) {
      const quotes = [
        "The best way to get started is to quit talking and begin doing.",
        "Don't let yesterday take up too much of today.",
        "It's not whether you get knocked down, it's whether you get up.",
        "If you are working on something exciting, it will keep you motivated.",
        "Success is not in what you have, but who you are.",
        "The harder you work for something, the greater you'll feel when you achieve it.",
        "Dream bigger. Do bigger.",
        "Don't watch the clock; do what it does. Keep going.",
        "Great things never come from comfort zones.",
        "Push yourself, because no one else is going to do it for you."
      ];
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setRandomQuote(quotes[randomIndex]);
    }
  }, [showName]);

  const showButtons = loggedInUser && location.pathname === '/';

  const userName = loggedInUser ? JSON.parse(loggedInUser).username : '';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Good Morning";
    } else if (hour >= 18 || hour < 5) {
      return "Good Night";
    } else {
      return "Hello";
    }
  };

  return (
    <header className="bg-indigo-600 text-white p-4 flex items-center justify-between">
      <div className="flex items-center justify-start w-1/4 relative">
        {loggedInUser && (
          <div className="relative">
            <button
              onClick={() => setShowName(!showName)}
              className={`bg-gray-300 rounded-full flex items-center justify-center cursor-pointer text-indigo-600 font-bold transition-all duration-300 ease-in-out ${
                showName ? "h-16 w-16 text-3xl" : "h-10 w-10 text-lg"
              }`}
              title="Profile"
            >
              {/* Profile icon as initials */}
              {userName.charAt(0).toUpperCase()}
            </button>
            {showName && (
              <div className="absolute top-20 left-0 bg-white text-black rounded shadow p-6 z-10 w-64">
                <p className="font-semibold text-lg">{getGreeting()},</p>
                <p className="font-bold text-2xl">{userName}</p>
                <p className="italic mt-4 text-base">"{randomQuote}"</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center w-2/4">
        <img src={mzcetLogo} alt="MZCET Logo" className="h-14 w-14" />
        <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>
          Attendance Alert App 
        </h1>
      </div>
      <div className="flex items-center justify-end w-1/4 space-x-4">
        {showButtons && (
          <>
            <button
              onClick={() => navigate("/collections")}
              className="px-6 py-3 bg-indigo-800 rounded hover:bg-indigo-700 text-white text-lg"
            >
              View Collections
            </button>
            <LogoutButton onLogout={() => setLoggedInUser(null)} className="px-6 py-3 text-lg" />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
