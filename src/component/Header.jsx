import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold cursor-pointer" onClick={() => navigate("/")}>
        Excel Uploader App
      </h1>
      <button
        onClick={() => navigate("/collections")}
        className="px-4 py-2 bg-indigo-800 rounded hover:bg-indigo-700"
      >
        View Collections
      </button>
    </header>
  );
};

export default Header;
