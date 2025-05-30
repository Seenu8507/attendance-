import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CollectionViewer = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionData, setCollectionData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch("http://localhost:5000/collections");
      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }
      const data = await response.json();
      setCollections(data.collections);
      setShowDialog(true);
    } catch (error) {
      alert("Error fetching collections: " + error.message);
    }
  };

  const fetchCollectionData = async (collectionName) => {
    try {
      const response = await fetch(`http://localhost:5000/collection-data/${collectionName}`);
      if (!response.ok) {
        throw new Error("Failed to fetch collection data");
      }
      const data = await response.json();
      setCollectionData(data.data);
      setSelectedCollection(collectionName);
      setShowDialog(false);
    } catch (error) {
      alert("Error fetching collection data: " + error.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MongoDB Collections Viewer</h1>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Select a Collection</h2>
            <ul className="max-h-60 overflow-y-auto">
              {collections.map((col) => (
                <li
                  key={col}
                  className="cursor-pointer p-2 hover:bg-gray-200 rounded"
                  onClick={() => fetchCollectionData(col)}
                >
                  {col}
                </li>
              ))}
            </ul>
            <div className="flex space-x-4 mt-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => navigate("/")}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCollection && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Data from: {selectedCollection}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  {collectionData.length > 0 &&
                    Object.keys(collectionData[0]).map((key) => (
                      <th
                        key={key}
                        className="border border-gray-300 px-4 py-2 bg-gray-100 text-left"
                      >
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {collectionData.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.keys(doc).map((key) => (
                      <td key={key} className="border border-gray-300 px-4 py-2">
                        {typeof doc[key] === "object"
                          ? JSON.stringify(doc[key])
                          : String(doc[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => {
                setSelectedCollection(null);
                setCollectionData([]);
                setShowDialog(true);
              }}
            >
              Select Another Collection
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded"
              onClick={() => navigate("/")}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionViewer;
