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
      const response = await fetch("http://localhost:5000/leavedata/collections");
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
      const response = await fetch(`http://localhost:5000/leavedata/collection-data/${collectionName}`);
      if (!response.ok) {
        throw new Error("Failed to fetch collection data");
      }
      const data = await response.json();

      // Filter and map data to show only specified fields
      const filteredData = data.data.map((doc) => {
        return {
          studentname: doc.studentName || doc.StudentName || null,
          leavetype: doc.leaveType || doc.leavetype || null,
          receivedAt: doc.receivedAt ? format12hTime(new Date(doc.receivedAt)) : null,
          rawdata: doc.rawData || doc.rawdata || null,
          collection: collectionName,
          name: doc.name || null,
        };
      });

      setCollectionData(filteredData);
      setSelectedCollection(collectionName);
      setShowDialog(false);
    } catch (error) {
      alert("Error fetching collection data: " + error.message);
    }
  };

  // Helper function to format date to 12h time string hh:mm AM/PM
  const format12hTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">LeaveData Collections Viewer</h1>

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
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Student Name</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Leave Type</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Received At</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Raw Data</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Collection</th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left">Name</th>
                </tr>
              </thead>
              <tbody>
                {collectionData.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{doc.studentname || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">{doc.leavetype || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">{doc.receivedAt || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {doc.rawdata ? JSON.stringify(doc.rawdata) : "-"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{doc.collection || "-"}</td>
                    <td className="border border-gray-300 px-4 py-2">{doc.name || "-"}</td>
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
