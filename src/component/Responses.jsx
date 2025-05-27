import React, { useEffect, useState } from "react";

const Responses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use the provided ngrok public URL as API base URL
  const apiBaseUrl = "http://localhost:5000 ";

  useEffect(() => {
    fetch(apiBaseUrl + "/api/responses")
      .then((res) => res.json())
      .then((data) => {
        setResponses(data.responses || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching responses:", err);
        setLoading(false);
      });
  }, [apiBaseUrl]);

  if (loading) {
    return <div>Loading responses...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Twilio Responses</h2>
      {responses.length === 0 ? (
        <p>No responses found.</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">Received At</th>
              <th className="border border-gray-300 p-2">Response Data</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((resp, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">
                  {new Date(resp.receivedAt).toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">
                  <pre>{JSON.stringify(resp.data, null, 2)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Responses;
